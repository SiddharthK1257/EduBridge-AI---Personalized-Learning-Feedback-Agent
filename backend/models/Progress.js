const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalTestsTaken: {
    type: Number,
    default: 0
  },
  totalQuestionsAttempted: {
    type: Number,
    default: 0
  },
  totalCorrect: {
    type: Number,
    default: 0
  },
  totalWrong: {
    type: Number,
    default: 0
  },
  totalTimeSpentSeconds: {
    type: Number,
    default: 0
  },
  overallAccuracy: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 1
  },
  lastTestDate: {
    type: Date
  },
  weakTopics: [{
    topicName: String,
    accuracy: Number,
    attemptCount: Number
  }],
  strongTopics: [{
    topicName: String,
    accuracy: Number,
    attemptCount: Number
  }],
  overallLearningGapScore: {
    type: Number,
    default: 0
  },
  gapPriority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Low'
  },
  bestSubject: {
    type: String,
    default: 'N/A'
  },
  weakestSubject: {
    type: String,
    default: 'N/A'
  },
  strongestChapter: {
    type: String,
    default: 'N/A'
  },
  weakestChapter: {
    type: String,
    default: 'N/A'
  },
  examReadiness: {
    type: Number,
    default: 50
  },
  improvementPercentage: {
    type: Number,
    default: 0
  },
  recoveryProgress: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Progress', ProgressSchema);
