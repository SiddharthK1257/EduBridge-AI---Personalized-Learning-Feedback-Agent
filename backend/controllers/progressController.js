const Progress = require('../models/Progress');
const Attempt = require('../models/Attempt');
const StudyPlan = require('../models/StudyPlan');
const Notification = require('../models/Notification');

// @desc    Get user dashboard progress overview metrics & chart data
// @route   GET /api/progress/me
// @access  Private
const getMyProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      progress = await Progress.create({
        user: req.user._id,
        totalTestsTaken: 0,
        totalQuestionsAttempted: 0,
        overallAccuracy: 0,
        averageScore: 0,
        currentStreak: 1,
        weakTopics: [],
        strongTopics: [],
        overallLearningGapScore: 0,
        gapPriority: 'Low'
      });
    }

    // Fetch recent 5 test attempts
    const recentAttempts = await Attempt.find({ user: req.user._id })
      .populate({
        path: 'mockTest',
        populate: { path: 'subject', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch active study plan
    const studyPlan = await StudyPlan.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    // Fetch notifications count
    const unreadNotificationsCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    // Build timeline chart data (Weekly & Monthly trends from actual MongoDB attempts)
    const allAttempts = await Attempt.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(30);

    const progressTrend = allAttempts.map((att, idx) => ({
      testIndex: `Test #${idx + 1}`,
      date: new Date(att.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      accuracy: att.accuracy,
      score: att.score,
      learningGapScore: att.learningGapScore,
      avgTime: att.avgTimePerQuestionSeconds
    }));

    return res.json({
      success: true,
      progress,
      recentAttempts,
      studyPlan,
      unreadNotificationsCount,
      progressTrend
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyProgress
};
