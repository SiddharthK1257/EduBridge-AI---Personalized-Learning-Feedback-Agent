const fs = require('fs');
const path = require('path');
const MarksheetAnalysis = require('../models/MarksheetAnalysis');
const Progress = require('../models/Progress');
const StudyPlan = require('../models/StudyPlan');
const Attempt = require('../models/Attempt');
const Feedback = require('../models/Feedback');
const marksheetService = require('../services/marksheetService');

/**
 * @desc    Upload file and perform initial OCR extraction
 * @route   POST /api/marksheet/upload-ocr
 * @access  Private
 */
const uploadAndExtract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid PDF or Image file' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Call OCR extraction service
    const extractedData = await marksheetService.extractMarksheetData(filePath, mimeType);

    // Form relative file URL for front-end preview
    const fileUrl = `/uploads/marksheets/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'OCR extraction completed successfully',
      fileDetails: {
        fileName: req.file.originalname,
        storedFileName: req.file.filename,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      },
      extractedData: extractedData
    });
  } catch (err) {
    console.error('[Upload & Extract Error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to process marksheet' });
  }
};

/**
 * @desc    Save validated/edited extracted data & run Deep AI Analysis
 * @route   POST /api/marksheet/save-analyze
 * @access  Private
 * 
 * STEPS INVOLVED:
 * STEP 5: Store validated data in MongoDB.
 * STEP 6: Fetch historical student data (previous marksheets, mock tests, topics, gap scores, study planner, mentor history).
 * STEP 7: Merge both datasets (current OCR marksheet + MongoDB history).
 * STEP 8: Generate evidence-based AI analysis.
 */
const saveAndAnalyze = async (req, res) => {
  try {
    const { fileName, fileUrl, fileType, fileSize, extractedData, targetScore } = req.body;

    if (!extractedData || !extractedData.subjects) {
      return res.status(400).json({ success: false, message: 'Invalid or missing extracted data' });
    }

    // STEP 6: Fetch historical student data from MongoDB
    const previousMarksheets = await MarksheetAnalysis.find({ user: req.user._id }).sort({ createdAt: -1 });
    const previousAttempts = await Attempt.find({ user: req.user._id })
      .populate({
        path: 'mockTest',
        populate: [
          { path: 'subject', select: 'name' },
          { path: 'topic', select: 'name' },
          { path: 'chapter', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(15);
    const userProgress = await Progress.findOne({ user: req.user._id });
    const activeStudyPlan = await StudyPlan.findOne({ user: req.user._id });
    const aiMentorHistory = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);

    // STEP 7: Merge both datasets
    const mergedHistoricalData = {
      hasPreviousHistory: previousAttempts.length > 0 || previousMarksheets.length > 0,
      previousMarksheetsCount: previousMarksheets.length,
      previousMarksheets: previousMarksheets.map(m => ({
        examName: m.extractedData?.examName || m.fileName,
        semester: m.extractedData?.semester || m.extractedData?.classGrade || 'Previous Semester',
        overallPercentage: m.extractedData?.overallPercentage,
        cgpa: m.extractedData?.cgpa,
        subjects: (m.extractedData?.subjects || []).map(s => ({
          subjectName: s.subjectName,
          obtainedMarks: s.obtainedMarks,
          maxMarks: s.maxMarks
        }))
      })),
      previousMockTestsCount: previousAttempts.length,
      previousMockTests: previousAttempts.map(a => ({
        title: a.mockTest?.title || 'Mock Test',
        subject: a.mockTest?.subject?.name || 'General',
        accuracy: a.accuracy,
        score: a.score,
        learningGapScore: a.learningGapScore,
        avgTimePerQuestionSeconds: a.avgTimePerQuestionSeconds,
        attemptedAt: a.createdAt
      })),
      topicWisePerformance: userProgress?.weakTopics || [],
      chapterWisePerformance: userProgress?.strongTopics || [],
      learningGapScore: userProgress?.overallLearningGapScore || null,
      activeStudyPlan: activeStudyPlan ? {
        examDate: activeStudyPlan.examDate,
        targetScore: activeStudyPlan.targetScore,
        availableHoursPerDay: activeStudyPlan.availableHoursPerDay
      } : null,
      mentorHistoryCount: aiMentorHistory.length
    };

    // STEP 8: Generate AI analysis using merged datasets
    const aiAnalysis = await marksheetService.analyzeMarksheetData(extractedData, mergedHistoricalData);

    // Generate 1-Click Recovery Plan
    const recoveryPlan = await marksheetService.generateRecoveryPlan(extractedData, aiAnalysis);

    // Calculate initial Target Score projections
    const targetScoreAnalysis = await marksheetService.calculateTargetScoreProjection(
      extractedData, 
      targetScore || { targetPercentage: 85 }
    );

    // STEP 5: Store in MongoDB MarksheetAnalysis collection
    const marksheetRecord = await MarksheetAnalysis.create({
      user: req.user._id,
      fileName: fileName || 'Uploaded Marksheet',
      fileUrl: fileUrl || '',
      fileType: fileType || 'application/pdf',
      fileSize: fileSize || 0,
      extractedData: extractedData,
      aiAnalysis: aiAnalysis,
      recoveryPlan: recoveryPlan,
      targetScoreAnalysis: targetScoreAnalysis
    });

    // 6. Integrate with EduBridge AI Progress & Learning Gap System
    if (userProgress) {
      const newWeakNames = (aiAnalysis.weakSubjects || []).map(w => ({
        topicName: `${w} (Marksheet Gap)`,
        accuracy: 45,
        attemptCount: 1
      }));
      
      const newStrongNames = (aiAnalysis.strongSubjects || []).map(s => ({
        topicName: `${s} (Marksheet Strength)`,
        accuracy: 85,
        attemptCount: 1
      }));

      userProgress.weakTopics = [...userProgress.weakTopics, ...newWeakNames].slice(0, 10);
      userProgress.strongTopics = [...userProgress.strongTopics, ...newStrongNames].slice(0, 10);
      userProgress.overallLearningGapScore = Math.max(userProgress.overallLearningGapScore || 0, aiAnalysis.learningGapScore || 30);
      await userProgress.save();
    }

    res.status(201).json({
      success: true,
      message: 'Marksheet saved and deep AI analysis completed successfully',
      data: marksheetRecord
    });
  } catch (err) {
    console.error('[Save & Analyze Error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to analyze marksheet' });
  }
};

/**
 * @desc    Get all user marksheets
 * @route   GET /api/marksheet
 * @access  Private
 */
const getUserMarksheets = async (req, res) => {
  try {
    const marksheets = await MarksheetAnalysis.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: marksheets.length,
      data: marksheets
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get single marksheet analysis by ID
 * @route   GET /api/marksheet/:id
 * @access  Private
 */
const getMarksheetById = async (req, res) => {
  try {
    const marksheet = await MarksheetAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!marksheet) {
      return res.status(404).json({ success: false, message: 'Marksheet record not found' });
    }

    res.status(200).json({
      success: true,
      data: marksheet
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Delete a marksheet record
 * @route   DELETE /api/marksheet/:id
 * @access  Private
 */
const deleteMarksheet = async (req, res) => {
  try {
    const marksheet = await MarksheetAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!marksheet) {
      return res.status(404).json({ success: false, message: 'Marksheet record not found' });
    }

    // Try deleting physical file
    if (marksheet.fileUrl) {
      const physicalPath = path.join(__dirname, '..', marksheet.fileUrl);
      if (fs.existsSync(physicalPath)) {
        fs.unlinkSync(physicalPath);
      }
    }

    await MarksheetAnalysis.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Marksheet deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Generate / Refresh Recovery Plan for Marksheet
 * @route   POST /api/marksheet/:id/recovery-plan
 * @access  Private
 */
const generateRecoveryPlanController = async (req, res) => {
  try {
    const marksheet = await MarksheetAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!marksheet) {
      return res.status(404).json({ success: false, message: 'Marksheet not found' });
    }

    const recoveryPlan = await marksheetService.generateRecoveryPlan(
      marksheet.extractedData,
      marksheet.aiAnalysis
    );

    marksheet.recoveryPlan = recoveryPlan;
    await marksheet.save();

    res.status(200).json({
      success: true,
      message: 'Recovery plan generated successfully',
      data: recoveryPlan
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Sync Recovery Plan directly to user's central Study Plan module
 * @route   POST /api/marksheet/:id/sync-study-planner
 * @access  Private
 */
const syncToStudyPlanner = async (req, res) => {
  try {
    const marksheet = await MarksheetAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!marksheet || !marksheet.recoveryPlan) {
      return res.status(404).json({ success: false, message: 'Marksheet or Recovery Plan not found' });
    }

    const rec = marksheet.recoveryPlan;

    // Convert recovery plan daily/weekly/healthy schedules to StudyPlan format
    const dailyPlan = (rec.dailySchedule || []).map(d => ({
      timeSlot: d.timeSlot,
      activity: d.activity,
      topicOrChapter: d.focusSubject,
      completed: false
    }));

    const weeklyPlan = (rec.weeklySchedule || []).map(w => ({
      day: w.day,
      focusArea: w.focusArea,
      targetHours: w.targetHours || 3,
      taskCount: 3
    }));

    const monthlyPlan = (rec.monthlyGoals || []).map((g, idx) => ({
      week: `Week ${idx + 1}`,
      objective: g
    }));

    const healthyRoutine = {
      sleepTime: "10:30 PM",
      wakeTime: "06:00 AM",
      exerciseTime: "06:30 AM (Light workout / Yoga)",
      waterReminder: "Drink 250ml water every 2 hours",
      meditationTime: "15 mins breathing mindfulness post study",
      screenBreakInterval: "45 min study / 5 min screen break",
      healthyHabits: ["Hydrate frequently", "Maintain posture", "Night screen filter"]
    };

    let studyPlan = await StudyPlan.findOne({ user: req.user._id });
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    if (studyPlan) {
      studyPlan.dailyPlan = dailyPlan;
      studyPlan.weeklyPlan = weeklyPlan;
      studyPlan.monthlyPlan = monthlyPlan;
      studyPlan.healthyRoutine = healthyRoutine;
      studyPlan.revisionSchedule = rec.revisionCalendar || [];
      studyPlan.mockTestSchedule = rec.mockTestSchedule || [];
      await studyPlan.save();
    } else {
      studyPlan = await StudyPlan.create({
        user: req.user._id,
        examDate: targetDate,
        availableHoursPerDay: 4,
        targetScore: marksheet.targetScoreAnalysis?.targetPercentage || 85,
        dailyPlan,
        weeklyPlan,
        monthlyPlan,
        healthyRoutine,
        revisionSchedule: rec.revisionCalendar || [],
        mockTestSchedule: rec.mockTestSchedule || []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recovery Plan successfully synced to your EduBridge AI Study Planner!',
      data: studyPlan
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Calculate Target Score projections
 * @route   POST /api/marksheet/:id/target-score
 * @access  Private
 */
const calculateTargetScore = async (req, res) => {
  try {
    const { targetPercentage, targetCGPA } = req.body;
    const marksheet = await MarksheetAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!marksheet) {
      return res.status(404).json({ success: false, message: 'Marksheet not found' });
    }

    const projection = await marksheetService.calculateTargetScoreProjection(
      marksheet.extractedData,
      { targetPercentage, targetCGPA }
    );

    marksheet.targetScoreAnalysis = projection;
    await marksheet.save();

    res.status(200).json({
      success: true,
      data: projection
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Compare multiple marksheets
 * @route   POST /api/marksheet/compare
 * @access  Private
 */
const compareMarksheetsController = async (req, res) => {
  try {
    const { marksheetIds } = req.body;
    if (!marksheetIds || !Array.isArray(marksheetIds) || marksheetIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Please select at least two marksheets to compare' });
    }

    const marksheets = await MarksheetAnalysis.find({
      _id: { $in: marksheetIds },
      user: req.user._id
    }).sort({ createdAt: 1 });

    if (marksheets.length < 2) {
      return res.status(404).json({ success: false, message: 'Could not find selected marksheets' });
    }

    const comparisonResult = await marksheetService.compareMarksheets(marksheets);

    res.status(200).json({
      success: true,
      data: comparisonResult
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Ask AI Mentor about a specific marksheet
 * @route   POST /api/marksheet/:id/chat
 * @access  Private
 */
const chatWithMentor = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Please provide a question' });
    }

    const marksheet = await MarksheetAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!marksheet) {
      return res.status(404).json({ success: false, message: 'Marksheet record not found' });
    }

    const answer = await marksheetService.askMentorAboutMarksheet(marksheet, question);

    res.status(200).json({
      success: true,
      answer: answer
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Export Recovery Plan to iCalendar (.ics) file
 * @route   GET /api/marksheet/:id/export-ics
 * @access  Private
 */
const exportCalendarICS = async (req, res) => {
  try {
    const marksheet = await MarksheetAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!marksheet || !marksheet.recoveryPlan) {
      return res.status(404).json({ success: false, message: 'Marksheet or Recovery Plan not found' });
    }

    const plan = marksheet.recoveryPlan;
    const days = plan.plan7Days || [];
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EduBridge AI//Marksheet Recovery Planner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const today = new Date();
    days.forEach((d, idx) => {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + (d.day || idx + 1));
      const dateStr = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, '').substring(0, 8);

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:edubridge-recovery-${d.day || idx}-${Date.now()}@edubridge.ai`);
      icsContent.push(`DTSTAMP:${dateStr}T090000Z`);
      icsContent.push(`DTSTART:${dateStr}T090000Z`);
      icsContent.push(`DTEND:${dateStr}T${9 + (d.hours || 3)}0000Z`);
      icsContent.push(`SUMMARY:EduBridge AI Recovery - Day ${d.day || idx + 1}: ${d.title || d.focus}`);
      icsContent.push(`DESCRIPTION:Focus Subject: ${d.focus}\\nTasks:\\n${(d.tasks || []).join('\\n')}`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="EduBridge_AI_Recovery_Plan.ics"');
    res.send(icsContent.join('\r\n'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  uploadAndExtract,
  saveAndAnalyze,
  getUserMarksheets,
  getMarksheetById,
  deleteMarksheet,
  generateRecoveryPlanController,
  syncToStudyPlanner,
  calculateTargetScore,
  compareMarksheetsController,
  chatWithMentor,
  exportCalendarICS
};

