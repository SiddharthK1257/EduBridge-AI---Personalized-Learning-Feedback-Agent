const MockTest = require('../models/MockTest');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const Feedback = require('../models/Feedback');
const Progress = require('../models/Progress');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Chapter = require('../models/Chapter');
const Notification = require('../models/Notification');
const MarksheetAnalysis = require('../models/MarksheetAnalysis');
const StudyPlan = require('../models/StudyPlan');
const geminiService = require('../services/geminiService');
const { calculateLearningGapScore } = require('../services/gapScoreCalculator');

// @desc    Generate dynamic AI test & save to MongoDB (With Duplication Checking)
// @route   POST /api/tests/generate
// @access  Private
const generateTest = async (req, res) => {
  try {
    const {
      exam,
      grade,
      board = 'CBSE',
      subjectId,
      subject: subjectParam,
      testType = 'Topic', // 'Topic' or 'Chapter'
      topicId,
      topic: topicParam,
      chapterId,
      chapter: chapterParam,
      difficulty = 'Mixed',
      questionCount,
      revisionMode = false
    } = req.body;

    const userId = req.user._id;

    // Validate parameters - require basic context
    const effectiveExam = exam || req.user.examTarget;
    const effectiveGrade = grade || req.user.gradeClass;

    // Flexible Subject resolution
    let subject = null;
    if (subjectId) {
      if (require('mongoose').Types.ObjectId.isValid(subjectId)) {
        subject = await Subject.findById(subjectId);
      }
    }
    if (!subject && (subjectParam || req.body.subjectName)) {
      const subName = subjectParam || req.body.subjectName;
      subject = await Subject.findOne({ name: new RegExp(`^${subName.trim()}$`, 'i') });
      if (!subject) {
        subject = await Subject.create({
          name: subName.trim(),
          exam: effectiveExam || 'JEE Main',
          grade: effectiveGrade || 'Class 12',
          category: 'Core'
        });
      }
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient context provided. Please specify exam, grade, subject, chapter, topic, difficulty, and question count.'
      });
    }

    let topic = null;
    let chapter = null;
    let targetTitle = '';

    if (testType === 'Topic') {
      if (topicId && require('mongoose').Types.ObjectId.isValid(topicId)) {
        topic = await Topic.findById(topicId);
      } else if (topicParam || req.body.topicName) {
        const tName = topicParam || req.body.topicName;
        topic = await Topic.findOne({ subject: subject._id, name: new RegExp(`^${tName.trim()}$`, 'i') });
        if (!topic) {
          topic = await Topic.create({ subject: subject._id, name: tName.trim() });
        }
      }
      targetTitle = topic ? topic.name : (topicParam || req.body.topicName || 'Topic Test');
    } else {
      if (chapterId && require('mongoose').Types.ObjectId.isValid(chapterId)) {
        chapter = await Chapter.findById(chapterId);
      } else if (chapterParam || req.body.chapterName) {
        const cName = chapterParam || req.body.chapterName;
        chapter = await Chapter.findOne({ subject: subject._id, name: new RegExp(`^${cName.trim()}$`, 'i') });
        if (!chapter) {
          chapter = await Chapter.create({ subject: subject._id, name: cName.trim() });
        }
      }
      targetTitle = chapter ? chapter.name : (chapterParam || req.body.chapterName || 'Chapter Test');
    }

    let count = questionCount ? parseInt(questionCount) : (testType === 'Topic' ? 5 : 15);

    // Fetch student's previously attempted / generated questions from MongoDB to prevent duplication (unless revisionMode is true)
    let previousQuestionTexts = [];
    if (!revisionMode) {
      const previousQuestions = await Question.find({ user: userId }).select('questionText').sort({ createdAt: -1 }).limit(50);
      previousQuestionTexts = previousQuestions.map(q => q.questionText);
    }

    // Fetch user progress for adaptive difficulty prompting
    const userProgress = await Progress.findOne({ user: userId });

    // Call Gemini API to generate personalized questions with anti-duplication filter
    const aiQuestions = await geminiService.generateQuestions({
      exam: exam || req.user.examTarget || 'JEE Main',
      grade: grade || req.user.gradeClass || 'Class 12',
      board,
      subjectName: subject.name,
      topicName: topic ? topic.name : null,
      chapterName: chapter ? chapter.name : null,
      difficulty,
      questionCount: count,
      previousPerformance: userProgress ? {
        accuracy: userProgress.overallAccuracy,
        weakTopics: userProgress.weakTopics
      } : {},
      previousQuestionTexts,
      revisionMode
    });

    // Save questions to MongoDB in 1 atomic bulk operation
    const questionDocs = aiQuestions.map(q => {
      const qStatement = q.questionText || q.question;
      const qConcept = q.conceptTested || q.concept || `${subject.name} Core Concept`;
      const qEstTime = parseInt(q.estimatedTimeSeconds || 45);
      const qBloom = q.bloomLevel || q.bloomsLevel || 'Apply';
      const qCorrectAns = q.correctAnswer || (q.options ? q.options[q.correctOptionIndex || 0] : '');

      return {
        user: userId,
        subject: subject._id,
        topic: topic ? topic._id : null,
        chapter: chapter ? chapter._id : null,
        topicName: topic ? topic.name : subject.name,
        chapterName: chapter ? chapter.name : subject.name,
        exam: exam || 'JEE Main',
        grade: grade || 'Class 12',
        board,
        questionText: qStatement,
        options: q.options,
        correctAnswer: qCorrectAns,
        correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
        explanation: q.explanation,
        difficulty: q.difficulty || (difficulty === 'Mixed' ? 'Medium' : difficulty),
        estimatedTimeSeconds: qEstTime,
        bloomLevel: qBloom,
        questionType: q.questionType || 'Conceptual',
        conceptTested: qConcept,
        learningObjective: q.learningObjective || `Master ${qConcept}`,
        isAiGenerated: true
      };
    });

    let finalQuestionDocs = questionDocs;
    if (!finalQuestionDocs || finalQuestionDocs.length === 0) {
      console.warn('[testController]: aiQuestions returned empty. Generating emergency fallback questions...');
      const fallbackQs = geminiService.generateRichDomainFallbackQuestions
        ? geminiService.generateRichDomainFallbackQuestions({
            count: count || 5,
            subjectName: subject.name,
            topicName: topic ? topic.name : null,
            chapterName: chapter ? chapter.name : null,
            difficulty,
            exam: effectiveExam,
            grade: effectiveGrade
          })
        : [];

      finalQuestionDocs = (fallbackQs.length > 0 ? fallbackQs : [
        {
          questionText: `What is the primary governing principle of ${subject.name}?`,
          options: [
            `Core conceptual principles & boundary conditions`,
            `Random variable fluctuations`,
            `Unconstrained linear expansion`,
            `Undefined static state`
          ],
          correctAnswer: `Core conceptual principles & boundary conditions`,
          correctOptionIndex: 0,
          explanation: `In ${subject.name}, core principles govern systems under defined boundary conditions.`,
          difficulty: 'Medium',
          estimatedTimeSeconds: 45,
          bloomLevel: 'Apply',
          questionType: 'Conceptual',
          conceptTested: `${subject.name} Core Concept`,
          learningObjective: `Master ${subject.name} foundations`
        }
      ]).map(q => ({
        user: userId,
        subject: subject._id,
        topic: topic ? topic._id : null,
        chapter: chapter ? chapter._id : null,
        topicName: topic ? topic.name : subject.name,
        chapterName: chapter ? chapter.name : subject.name,
        exam: effectiveExam || 'JEE Main',
        grade: effectiveGrade || 'Class 12',
        board,
        questionText: q.questionText || q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || q.options[0],
        correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
        explanation: q.explanation || 'Step-by-step explanation',
        difficulty: q.difficulty || 'Medium',
        estimatedTimeSeconds: 45,
        bloomLevel: q.bloomLevel || 'Apply',
        questionType: q.questionType || 'Conceptual',
        conceptTested: q.conceptTested || `${subject.name} Concept`,
        learningObjective: q.learningObjective || `Master ${subject.name}`,
        isAiGenerated: true
      }));
    }

    const savedQuestions = await Question.insertMany(finalQuestionDocs);
    const savedQuestionIds = savedQuestions.map(q => q._id);
    const totalEstTimeSeconds = savedQuestions.length * 45;

    // Create MockTest document in MongoDB
    const mockTest = await MockTest.create({
      user: userId,
      title: `${subject.name} - ${targetTitle} (${count} Qs)`,
      testType,
      exam: exam || 'JEE Main',
      grade: grade || 'Class 12',
      subject: subject._id,
      topic: topic ? topic._id : null,
      chapter: chapter ? chapter._id : null,
      difficulty,
      questions: savedQuestionIds,
      totalTimeSeconds: totalEstTimeSeconds
    });

    // Populate test details
    const populatedTest = await MockTest.findById(mockTest._id)
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('chapter', 'name')
      .populate('questions');

    return res.status(201).json({
      success: true,
      test: populatedTest
    });
  } catch (err) {
    console.error('[Generate Test Error]:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Mock Test details by ID
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id)
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('chapter', 'name')
      .populate('questions');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    return res.json({ success: true, test });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Submit Test Attempt, calculate metrics & negative marking, invoke Gemini Feedback & save to MongoDB
// @route   POST /api/tests/submit
// @access  Private
const submitTest = async (req, res) => {
  try {
    const { mockTestId, userAnswers, totalTimeSpentSeconds } = req.body;
    const userId = req.user._id;

    const mockTest = await MockTest.findById(mockTestId)
      .populate('questions')
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('chapter', 'name');

    if (!mockTest) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    const questions = mockTest.questions;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const evaluatedAnswers = [];
    const questionDetails = [];

    questions.forEach((q) => {
      const userAns = (userAnswers || []).find(a => String(a.questionId) === String(q._id));
      const selectedIndex = userAns && userAns.selectedOptionIndex !== undefined ? Number(userAns.selectedOptionIndex) : -1;
      const timeSpent = userAns ? (userAns.timeSpentSeconds || 0) : 0;

      let isCorrect = false;
      if (selectedIndex === -1) {
        skippedCount++;
      } else if (selectedIndex === q.correctOptionIndex) {
        correctCount++;
        isCorrect = true;
      } else {
        wrongCount++;
      }

      evaluatedAnswers.push({
        question: q._id,
        selectedOptionIndex: selectedIndex,
        isCorrect,
        timeSpentSeconds: timeSpent
      });

      questionDetails.push({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.options[q.correctOptionIndex],
        selectedAnswer: selectedIndex >= 0 ? q.options[selectedIndex] : 'Skipped',
        isCorrect,
        explanation: q.explanation,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
        questionType: q.questionType,
        conceptTested: q.conceptTested
      });
    });

    const totalQuestions = questions.length;
    // Standard competitive exam scoring: +4 for correct, negative marking for wrong if competitive exam
    const isNegativeExam = ['JEE Main', 'JEE Advanced', 'NEET', 'GATE', 'CAT', 'UPSC', 'Bank PO', 'SSC CGL', 'NDA'].includes(mockTest.exam);
    const negativeMarks = isNegativeExam ? wrongCount * 1 : 0;
    const totalMarks = totalQuestions * 4;
    const score = Math.max(0, (correctCount * 4) - negativeMarks);
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const avgTimePerQuestionSeconds = totalQuestions > 0 ? Math.round(totalTimeSpentSeconds / totalQuestions) : 0;

    const speedRating = avgTimePerQuestionSeconds <= 45 ? 'Fast' : avgTimePerQuestionSeconds <= 90 ? 'Optimal' : 'Slow';
    const consistencyScore = Math.max(10, Math.min(100, Math.round(100 - (wrongCount * 12))));
    const percentile = Math.min(99.9, Math.max(5.0, Math.round((accuracy * 0.95 + (speedRating === 'Fast' ? 4 : 0)) * 10) / 10));

    // Calculate Topic-wise, Chapter-wise, and Difficulty-wise Accuracies
    const topicMap = {};
    const chapterMap = {};
    const difficultyMap = {};

    questions.forEach((q, idx) => {
      const evalAns = evaluatedAnswers[idx];
      const topicName = q.topicName || (q.topic && q.topic.name) || mockTest.topic?.name || mockTest.subject?.name || 'General Topic';
      const chapterName = q.chapterName || (q.chapter && q.chapter.name) || mockTest.chapter?.name || mockTest.subject?.name || 'General Chapter';
      const diff = q.difficulty || 'Medium';

      // Topic Map
      if (!topicMap[topicName]) {
        topicMap[topicName] = { topicName, questionsCount: 0, correct: 0, wrong: 0, skipped: 0, totalTime: 0 };
      }
      topicMap[topicName].questionsCount++;
      if (evalAns.selectedOptionIndex === -1) topicMap[topicName].skipped++;
      else if (evalAns.isCorrect) topicMap[topicName].correct++;
      else topicMap[topicName].wrong++;
      topicMap[topicName].totalTime += (evalAns.timeSpentSeconds || 0);

      // Chapter Map
      if (!chapterMap[chapterName]) {
        chapterMap[chapterName] = { chapterName, questionsCount: 0, correct: 0, wrong: 0, skipped: 0 };
      }
      chapterMap[chapterName].questionsCount++;
      if (evalAns.isCorrect) chapterMap[chapterName].correct++;
      else if (evalAns.selectedOptionIndex !== -1) chapterMap[chapterName].wrong++;
      else chapterMap[chapterName].skipped++;

      // Difficulty Map
      if (!difficultyMap[diff]) {
        difficultyMap[diff] = { difficulty: diff, attempted: 0, correct: 0, wrong: 0 };
      }
      difficultyMap[diff].attempted++;
      if (evalAns.isCorrect) difficultyMap[diff].correct++;
      else if (evalAns.selectedOptionIndex !== -1) difficultyMap[diff].wrong++;
    });

    const topicWiseAccuracy = Object.values(topicMap).map(t => {
      const acc = t.questionsCount > 0 ? Math.round((t.correct / t.questionsCount) * 100) : 0;
      return {
        topicName: t.topicName,
        questionsCount: t.questionsCount,
        correct: t.correct,
        wrong: t.wrong,
        accuracy: acc,
        averageTime: t.questionsCount > 0 ? Math.round(t.totalTime / t.questionsCount) : 0,
        confidence: acc,
        recommendation: acc < 50 ? 'Needs immediate concept revision & step-by-step practice.' : 'Good mastery! Maintain speed with weekly drills.'
      };
    });

    const chapterWiseAccuracy = Object.values(chapterMap).map(c => {
      const acc = c.questionsCount > 0 ? Math.round((c.correct / c.questionsCount) * 100) : 0;
      return {
        chapterName: c.chapterName,
        questionsCount: c.questionsCount,
        correct: c.correct,
        wrong: c.wrong,
        accuracy: acc,
        learningGap: acc < 40 ? 'High' : acc < 70 ? 'Moderate' : 'Low',
        estimatedStudyHours: acc < 40 ? 6 : acc < 70 ? 3 : 1,
        priority: acc < 40 ? 'Immediate' : acc < 70 ? 'High' : 'Low'
      };
    });

    const difficultyWiseAccuracy = Object.values(difficultyMap).map(d => {
      const acc = d.attempted > 0 ? Math.round((d.correct / d.attempted) * 100) : 0;
      return {
        difficulty: d.difficulty,
        attempted: d.attempted,
        correct: d.correct,
        wrong: d.wrong,
        accuracy: acc,
        speed: speedRating,
        conceptStrength: acc >= 75 ? 'Strong' : acc >= 40 ? 'Moderate' : 'Weak'
      };
    });

    // Calculate AI Learning Gap Score
    const { learningGapScore, gapPriority } = calculateLearningGapScore({
      accuracy,
      wrongCount,
      totalQuestions,
      avgTimeSpentSeconds: avgTimePerQuestionSeconds
    });

    // Create Attempt record in MongoDB
    const attempt = await Attempt.create({
      user: userId,
      mockTest: mockTest._id,
      userAnswers: evaluatedAnswers,
      score,
      totalMarks,
      accuracy,
      correctCount,
      wrongCount,
      skippedCount,
      negativeMarks,
      percentile,
      speedRating,
      consistencyScore,
      totalTimeSpentSeconds,
      avgTimePerQuestionSeconds,
      topicWiseAccuracy,
      chapterWiseAccuracy,
      difficultyWiseAccuracy,
      learningGapScore,
      gapPriority
    });

    // Mark test completed
    mockTest.isCompleted = true;
    await mockTest.save();

    // Trigger Gemini AI Performance Feedback Analysis
    const aiFeedback = await geminiService.generatePerformanceFeedback({
      testTitle: mockTest.title,
      subjectName: mockTest.subject ? mockTest.subject.name : 'General Subject',
      exam: mockTest.exam,
      grade: mockTest.grade,
      score,
      totalMarks,
      accuracy,
      correctCount,
      wrongCount,
      skippedCount,
      totalTimeSpentSeconds,
      avgTimePerQuestionSeconds,
      learningGapScore,
      gapPriority,
      questionDetails,
      topicWiseAccuracy,
      chapterWiseAccuracy,
      difficultyWiseAccuracy,
      previousTestHistory: { previousAttemptsCount: await Attempt.countDocuments({ user: userId }) }
    });

    // Save Feedback document in MongoDB
    const feedbackDoc = await Feedback.create({
      user: userId,
      attempt: attempt._id,
      overallGrade: aiFeedback.overallGrade || (accuracy >= 80 ? 'A+' : accuracy >= 60 ? 'B' : 'Needs Focus'),
      strengthsAllowed: aiFeedback.strengthsAllowed,
      strengths: aiFeedback.strengths || [],
      weaknesses: aiFeedback.weaknesses || [],
      learningGaps: aiFeedback.learningGaps || [],
      topicWiseAnalysis: aiFeedback.topicWiseAnalysis || topicWiseAccuracy,
      chapterWiseAnalysis: aiFeedback.chapterWiseAnalysis || chapterWiseAccuracy,
      difficultyWiseAnalysis: aiFeedback.difficultyWiseAnalysis || difficultyWiseAccuracy,
      aiLearningGaps: aiFeedback.aiLearningGaps,
      recoveryPlan: aiFeedback.recoveryPlan,
      studyPlanner: aiFeedback.studyPlanner,
      mistakeAnalysis: aiFeedback.mistakeAnalysis || '',
      confidenceScore: aiFeedback.confidenceScore || accuracy,
      estimatedStudyHours: aiFeedback.estimatedStudyHours || (accuracy < 40 ? 10 : 4),
      examReadiness: aiFeedback.examReadiness || Math.max(10, Math.round(accuracy * 0.85)),
      improvementSuggestions: aiFeedback.improvementSuggestions || [],
      studyStrategy: aiFeedback.studyStrategy || '',
      motivationalFeedback: aiFeedback.motivationalFeedback || ''
    });

    // Update User Progress in MongoDB with dynamic stats
    let progress = await Progress.findOne({ user: userId });
    if (!progress) {
      progress = new Progress({ user: userId });
    }

    progress.totalTestsTaken += 1;
    progress.totalQuestionsAttempted += totalQuestions;
    progress.totalCorrect += correctCount;
    progress.totalWrong += wrongCount;
    progress.totalTimeSpentSeconds += totalTimeSpentSeconds;

    progress.overallAccuracy = progress.totalQuestionsAttempted > 0
      ? Math.round((progress.totalCorrect / progress.totalQuestionsAttempted) * 100)
      : 0;

    progress.averageScore = Math.round(
      ((progress.averageScore * (progress.totalTestsTaken - 1)) + accuracy) / progress.totalTestsTaken
    );

    // Update streak
    const now = new Date();
    if (!progress.lastTestDate) {
      progress.currentStreak = 1;
    } else {
      const diffHours = (now - new Date(progress.lastTestDate)) / (1000 * 60 * 60);
      if (diffHours < 36 && diffHours >= 12) {
        progress.currentStreak += 1;
      } else if (diffHours >= 36) {
        progress.currentStreak = 1;
      }
    }
    progress.lastTestDate = now;

    // Dynamically re-calculate Best/Weakest Subject & Chapter
    const allUserAttempts = await Attempt.find({ user: userId }).populate({
      path: 'mockTest',
      populate: [
        { path: 'subject', select: 'name' },
        { path: 'chapter', select: 'name' }
      ]
    });

    const subjectStats = {};
    const chapterStats = {};

    allUserAttempts.forEach(att => {
      const subName = att.mockTest?.subject?.name || 'General';
      const chapName = att.mockTest?.chapter?.name || att.mockTest?.title || 'General Chapter';
      
      if (!subjectStats[subName]) subjectStats[subName] = { totalAcc: 0, count: 0 };
      subjectStats[subName].totalAcc += att.accuracy;
      subjectStats[subName].count += 1;

      if (!chapterStats[chapName]) chapterStats[chapName] = { totalAcc: 0, count: 0 };
      chapterStats[chapName].totalAcc += att.accuracy;
      chapterStats[chapName].count += 1;
    });

    let bestSub = 'N/A';
    let worstSub = 'N/A';
    let maxSubAcc = -1;
    let minSubAcc = 101;

    Object.keys(subjectStats).forEach(sub => {
      const avg = subjectStats[sub].totalAcc / subjectStats[sub].count;
      if (avg > maxSubAcc) { maxSubAcc = avg; bestSub = sub; }
      if (avg < minSubAcc) { minSubAcc = avg; worstSub = sub; }
    });

    let bestChap = 'N/A';
    let worstChap = 'N/A';
    let maxChapAcc = -1;
    let minChapAcc = 101;

    Object.keys(chapterStats).forEach(chap => {
      const avg = chapterStats[chap].totalAcc / chapterStats[chap].count;
      if (avg > maxChapAcc) { maxChapAcc = avg; bestChap = chap; }
      if (avg < minChapAcc) { minChapAcc = avg; worstChap = chap; }
    });

    progress.bestSubject = bestSub;
    progress.weakestSubject = worstSub;
    progress.strongestChapter = bestChap;
    progress.weakestChapter = worstChap;
    progress.overallLearningGapScore = learningGapScore;
    progress.gapPriority = gapPriority;
    progress.examReadiness = Math.min(100, Math.max(10, Math.round((progress.overallAccuracy * 0.7) + (accuracy * 0.3))));
    progress.improvementPercentage = Math.max(0, Math.round(progress.overallAccuracy - (allUserAttempts[0]?.accuracy || accuracy)));
    progress.recoveryProgress = Math.min(100, Math.max(10, Math.round(100 - learningGapScore)));
    await progress.save();

    // Create Notification
    if (accuracy < 50) {
      await Notification.create({
        user: userId,
        type: 'Low Performance Alert',
        title: 'Action Needed: Low Test Accuracy',
        message: `You scored ${accuracy}% on ${mockTest.title}. Gemini AI recommends reviewing the high-priority learning gaps!`
      });
    } else {
      await Notification.create({
        user: userId,
        type: 'Weekly Report',
        title: 'Test Completed Successfully!',
        message: `Great effort! You achieved ${accuracy}% accuracy on ${mockTest.title}. Check out your personalized AI diagnostic feedback.`
      });
    }

    // Automatically trigger Gemini 2.5 Flash to generate / update Study Plan from Mock Test results
    try {
      const weakTopicsFromTest = topicWiseAccuracy.filter(t => t.accuracy < 60).map(t => t.topicName);
      const allTopicsFromTest = topicWiseAccuracy.map(t => t.topicName);
      const examTargetName = mockTest.exam || req.user.examTarget || 'JEE Main';
      const gradeClassName = mockTest.grade || req.user.gradeClass || 'Class 12';
      const subjectName = mockTest.subject ? mockTest.subject.name : 'General Subject';

      const generatedPlan = await geminiService.generateStudyPlan({
        examTarget: examTargetName,
        gradeClass: gradeClassName,
        subject: subjectName,
        topics: allTopicsFromTest.length > 0 ? allTopicsFromTest : [mockTest.title],
        examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        availableHoursPerDay: 5,
        targetScore: 90,
        weakAreas: weakTopicsFromTest.length > 0 ? weakTopicsFromTest : [`Accuracy enhancement in ${subjectName}`],
        previousTestAnalytics: {
          score,
          accuracy,
          correctCount,
          wrongCount,
          learningGapScore
        },
        progressData: progress ? {
          overallAccuracy: progress.overallAccuracy,
          weakTopics: progress.weakTopics
        } : {}
      });

      // Upsert the Study Plan with mock test trigger metadata
      await StudyPlan.findOneAndUpdate(
        { user: userId },
        {
          user: userId,
          examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          availableHoursPerDay: 5,
          targetScore: 90,
          subject: subjectName,
          topics: allTopicsFromTest,
          weakAreas: weakTopicsFromTest,
          generatedFromMockTest: true,
          triggerMockTest: mockTest._id,
          triggerMockTestTitle: mockTest.title,
          triggerMockTestScore: score,
          triggerMockTestAccuracy: accuracy,
          triggerMockTestDate: new Date(),
          overview: generatedPlan.overview || {
            daysRemaining: 30,
            targetScore: 90,
            dailyStudyHours: 5,
            examTarget: examTargetName
          },
          dailyPlan: generatedPlan.dailyPlan || [],
          weeklyPlan: generatedPlan.weeklyPlan || [],
          priorityTopics: generatedPlan.priorityTopics || [],
          revisionPlan: generatedPlan.revisionPlan || [],
          mockTests: generatedPlan.mockTests || [],
          healthTips: generatedPlan.healthTips || {},
          healthyRoutine: {
            sleepTime: generatedPlan.healthTips?.sleepRecommendation || '7-8 hours sound sleep (10:30 PM to 06:00 AM)',
            wakeTime: '06:00 AM',
            exerciseTime: generatedPlan.healthTips?.exerciseRecommendation || '20-30 mins morning light exercise or brisk walk',
            waterReminder: generatedPlan.healthTips?.waterReminder || 'Drink 250ml water every 2 hours (Minimum 2.5L daily)',
            meditationTime: generatedPlan.healthTips?.meditationTime || '10-15 mins evening mindfulness & breathing',
            screenBreakInterval: generatedPlan.healthTips?.breakTimings || '10 min screen-free break every 45 mins',
            healthyHabits: generatedPlan.motivation || []
          },
          examTips: generatedPlan.examTips || [],
          motivation: generatedPlan.motivation || [],
          last7DaysPlan: generatedPlan.last7DaysPlan || []
        },
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`[Study Plan Engine]: Auto-generated Study Roadmap from Mock Test '${mockTest.title}' for user ${userId}`);
    } catch (planErr) {
      console.error('[Auto Study Plan Generation Error]:', planErr.message);
    }

    return res.status(201).json({
      success: true,
      attempt,
      feedback: feedbackDoc,
      progress
    });
  } catch (err) {
    console.error('[Submit Test Error]:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Ask AI Mentor about a specific test attempt
// @route   POST /api/tests/mentor/chat
// @access  Private
const chatWithTestMentorController = async (req, res) => {
  try {
    const { attemptId, question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question text is required' });
    }

    let attemptData = {};
    if (attemptId) {
      attemptData = await Attempt.findById(attemptId)
        .populate({
          path: 'mockTest',
          populate: [
            { path: 'subject', select: 'name' },
            { path: 'topic', select: 'name' },
            { path: 'chapter', select: 'name' },
            { path: 'questions' }
          ]
        })
        .populate('userAnswers.question');
    }

    const userProgress = await Progress.findOne({ user: req.user._id });
    const latestMarksheet = await MarksheetAnalysis.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    const activeStudyPlan = await StudyPlan.findOne({ user: req.user._id });

    const studentHistory = {
      overallAccuracy: userProgress?.overallAccuracy || 0,
      bestSubject: userProgress?.bestSubject || 'N/A',
      weakestSubject: userProgress?.weakestSubject || 'N/A',
      weakTopics: userProgress?.weakTopics || [],
      strongTopics: userProgress?.strongTopics || [],
      learningGapScore: userProgress?.overallLearningGapScore || 0,
      marksheetAnalysis: latestMarksheet ? {
        overallPercentage: latestMarksheet.extractedData?.overallPercentage,
        weakSubjects: latestMarksheet.aiAnalysis?.weakSubjects
      } : null,
      studyPlan: activeStudyPlan ? {
        targetScore: activeStudyPlan.targetScore
      } : null
    };

    const answer = await geminiService.chatWithTestMentor({
      question,
      attemptData: attemptData || {},
      studentHistory
    });

    return res.json({ success: true, answer });
  } catch (err) {
    console.error('[Chat With Test Mentor Controller Error]:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get student's test history
// @route   GET /api/results/user/history
// @access  Private
const getUserTestHistory = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.user._id })
      .populate({
        path: 'mockTest',
        populate: [
          { path: 'subject', select: 'name' },
          { path: 'topic', select: 'name' },
          { path: 'chapter', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: attempts.length, attempts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get result by Attempt ID
// @route   GET /api/results/:attemptId
// @access  Private
const getResultById = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate({
        path: 'mockTest',
        populate: [
          { path: 'subject', select: 'name' },
          { path: 'topic', select: 'name' },
          { path: 'chapter', select: 'name' },
          { path: 'questions' }
        ]
      })
      .populate('userAnswers.question');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt result not found' });
    }

    const feedback = await Feedback.findOne({ attempt: attempt._id });

    return res.json({
      success: true,
      attempt,
      feedback
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  generateTest,
  getTestById,
  submitTest,
  chatWithTestMentorController,
  getUserTestHistory,
  getResultById
};
