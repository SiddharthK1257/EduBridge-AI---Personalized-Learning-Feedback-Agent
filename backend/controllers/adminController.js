const User = require('../models/User');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Chapter = require('../models/Chapter');
const Question = require('../models/Question');
const MockTest = require('../models/MockTest');
const Attempt = require('../models/Attempt');

// @desc    Get all registered students
// @route   GET /api/admin/users
// @access  Admin
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, count: students.length, students });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update student role or target
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete student account
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'Student account deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all questions (with filtering)
// @route   GET /api/admin/questions
// @access  Admin
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('chapter', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ success: true, count: questions.length, questions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create Question manually (Admin)
// @route   POST /api/admin/questions
// @access  Admin
const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    return res.status(201).json({ success: true, question });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete Question (Admin)
// @route   DELETE /api/admin/questions/:id
// @access  Admin
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    return res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get System-wide Analytics and Reports
// @route   GET /api/admin/analytics
// @access  Admin
const getSystemAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalSubjects = await Subject.countDocuments();
    const totalTopics = await Topic.countDocuments();
    const totalChapters = await Chapter.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalTestsGenerated = await MockTest.countDocuments();
    const totalAttempts = await Attempt.countDocuments();

    // Calculate system average accuracy
    const attempts = await Attempt.find().select('accuracy learningGapScore');
    let avgAccuracy = 0;
    let avgGapScore = 0;
    if (attempts.length > 0) {
      const sumAcc = attempts.reduce((acc, a) => acc + (a.accuracy || 0), 0);
      const sumGap = attempts.reduce((acc, a) => acc + (a.learningGapScore || 0), 0);
      avgAccuracy = Math.round(sumAcc / attempts.length);
      avgGapScore = Math.round(sumGap / attempts.length);
    }

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalSubjects,
        totalTopics,
        totalChapters,
        totalQuestions,
        totalTestsGenerated,
        totalAttempts,
        avgAccuracy,
        avgGapScore
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudents,
  updateUser,
  deleteUser,
  getQuestions,
  createQuestion,
  deleteQuestion,
  getSystemAnalytics
};
