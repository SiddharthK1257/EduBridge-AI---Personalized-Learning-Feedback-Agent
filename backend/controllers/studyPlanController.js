const StudyPlan = require('../models/StudyPlan');
const Progress = require('../models/Progress');
const geminiService = require('../services/geminiService');

// @desc    Generate personalized AI study plan & healthy routine
// @route   POST /api/studyplan/generate
// @access  Private
const generateStudyPlan = async (req, res) => {
  try {
    const {
      subject,
      topics,
      examDate,
      availableHoursPerDay,
      targetScore,
      weakAreas
    } = req.body;

    const userId = req.user._id;

    if (!examDate || !availableHoursPerDay || !targetScore) {
      return res.status(400).json({
        success: false,
        message: 'Please provide examDate, availableHoursPerDay, and targetScore'
      });
    }

    const parsedTopics = Array.isArray(topics)
      ? topics
      : (typeof topics === 'string' && topics.trim() ? topics.split(',').map(t => t.trim()) : []);

    const parsedWeakAreas = Array.isArray(weakAreas)
      ? weakAreas
      : (typeof weakAreas === 'string' && weakAreas.trim() ? weakAreas.split(',').map(w => w.trim()) : []);

    // Fetch user progress context for analytics & weak areas
    const progress = await Progress.findOne({ user: userId });

    // Defensive function check for geminiService.generateStudyPlan
    const generatePlanFn = typeof geminiService.generateStudyPlan === 'function'
      ? geminiService.generateStudyPlan
      : async (params) => {
          console.warn('[StudyPlanController]: Fallback invoked for generateStudyPlan');
          const days = Math.max(1, Math.ceil((new Date(params.examDate) - new Date()) / (1000 * 60 * 60 * 24)));
          return {
            overview: {
              daysRemaining: days,
              targetScore: Number(params.targetScore) || 90,
              dailyStudyHours: Number(params.availableHoursPerDay) || 5,
              examTarget: params.examTarget || 'Target Exam'
            },
            dailyPlan: [
              { timeSlot: '06:00 AM - 08:30 AM', activity: 'Theory & Core Concept Deep-Dive', topicOrChapter: (params.topics && params.topics[0]) || 'Core Concepts', completed: false },
              { timeSlot: '09:30 AM - 12:00 PM', activity: 'Problem Solving & Practice', topicOrChapter: (params.weakAreas && params.weakAreas.join(', ')) || 'Weak Areas Focus', completed: false },
              { timeSlot: '04:00 PM - 06:30 PM', activity: 'PYQs & Revision', topicOrChapter: (params.topics && params.topics[1]) || 'Formula Sheet', completed: false }
            ],
            weeklyPlan: [
              { week: 'Week 1', focusArea: 'Foundational Theory & High Weightage Topics', targetHours: (Number(params.availableHoursPerDay) || 5) * 7, taskCount: 14 },
              { week: 'Week 2', focusArea: 'Problem Solving Sprints & Mock Practice', targetHours: (Number(params.availableHoursPerDay) || 5) * 7, taskCount: 14 }
            ],
            priorityTopics: [
              { topicName: (params.topics && params.topics[0]) || 'Core Topic 1', subject: params.subject || 'General', priority: 'High', difficulty: 'Hard', estimatedHours: 16 }
            ],
            revisionPlan: [
              { day: 'Every 3rd Day', focus: 'Formula & Mistake Log Review', topics: params.topics || ['Core Syllabus'] }
            ],
            mockTests: [
              { testName: 'Full Length Mock 1', date: 'In 7 Days', focus: 'Time Allocation Strategy' }
            ],
            healthTips: {
              sleepRecommendation: '7-8 hours daily (10:30 PM to 06:00 AM)',
              breakTimings: '5-10 min break every 45 mins',
              waterReminder: 'Drink 250ml water every 2 hours',
              exerciseRecommendation: '20-30 mins light morning workout',
              meditationTime: '10 mins post-study relaxation'
            },
            examTips: ['Target high-confidence questions first', 'Do not spend >2 mins per MCQ'],
            motivation: ['Consistency creates top rankers!'],
            last7DaysPlan: [{ day: 'Day -7 to -1', task: 'Final formula review and light mock practice' }]
          };
        };

    // Call Gemini API to generate tailored study roadmap & healthy habits
    const aiPlan = await generatePlanFn({
      examTarget: req.user.examTarget || 'Target Exam',
      gradeClass: req.user.gradeClass || 'Target Grade',
      subject: subject || req.user.examTarget || 'Core Subjects',
      topics: parsedTopics,
      examDate,
      availableHoursPerDay: Number(availableHoursPerDay),
      targetScore: Number(targetScore),
      weakAreas: parsedWeakAreas,
      previousTestAnalytics: progress ? {
        overallAccuracy: progress.overallAccuracy,
        totalTestsTaken: progress.totalTestsTaken,
        learningGapScore: progress.overallLearningGapScore
      } : {},
      progressData: progress ? {
        overallAccuracy: progress.overallAccuracy,
        weakTopics: progress.weakTopics
      } : {}
    });

    const daysRemaining = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));

    // Upsert into MongoDB: if roadmap already exists, update it instead of creating duplicates
    const studyPlan = await StudyPlan.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        examDate: new Date(examDate),
        availableHoursPerDay: Number(availableHoursPerDay),
        targetScore: Number(targetScore),
        subject: subject || req.user.examTarget || 'General',
        topics: parsedTopics,
        weakAreas: parsedWeakAreas,
        overview: aiPlan.overview || {
          daysRemaining,
          targetScore: Number(targetScore),
          dailyStudyHours: Number(availableHoursPerDay),
          examTarget: req.user.examTarget || 'Target Exam'
        },
        dailyPlan: aiPlan.dailyPlan || [],
        weeklyPlan: aiPlan.weeklyPlan || [],
        priorityTopics: aiPlan.priorityTopics || [],
        revisionPlan: aiPlan.revisionPlan || [],
        mockTests: aiPlan.mockTests || [],
        healthTips: aiPlan.healthTips || {},
        healthyRoutine: {
          sleepTime: aiPlan.healthTips?.sleepRecommendation || '10:30 PM to 06:00 AM',
          wakeTime: '06:00 AM',
          exerciseTime: aiPlan.healthTips?.exerciseRecommendation || '30 mins morning workout',
          waterReminder: aiPlan.healthTips?.waterReminder || '250ml every 2 hours',
          meditationTime: aiPlan.healthTips?.meditationTime || '15 mins post study',
          screenBreakInterval: aiPlan.healthTips?.breakTimings || '5 min break every 45 mins',
          healthyHabits: aiPlan.motivation || []
        },
        examTips: aiPlan.examTips || [],
        motivation: aiPlan.motivation || [],
        last7DaysPlan: aiPlan.last7DaysPlan || []
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      studyPlan
    });
  } catch (err) {
    console.error('[Generate Study Plan Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error generating study plan'
    });
  }
};

// @desc    Get logged in user's active study plan
// @route   GET /api/studyplan/me
// @access  Private
const getMyStudyPlan = async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!studyPlan) {
      return res.json({ success: true, studyPlan: null });
    }
    return res.json({ success: true, studyPlan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle daily task completion in study plan
// @route   PUT /api/studyplan/toggle-task
// @access  Private
const toggleTaskCompletion = async (req, res) => {
  try {
    const { taskId } = req.body;
    const studyPlan = await StudyPlan.findOne({ user: req.user._id });

    if (!studyPlan) {
      return res.status(404).json({ success: false, message: 'No active study plan found' });
    }

    const task = studyPlan.dailyPlan.id(taskId);
    if (task) {
      task.completed = !task.completed;
      await studyPlan.save();
    }

    return res.json({ success: true, studyPlan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  generateStudyPlan,
  getMyStudyPlan,
  toggleTaskCompletion
};
