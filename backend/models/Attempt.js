const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  selectedOptionIndex: {
    type: Number, // -1 or null if skipped
    default: -1
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  timeSpentSeconds: {
    type: Number,
    default: 0
  }
});

const AttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mockTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: true
  },
  userAnswers: [AnswerSchema],
  score: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  correctCount: {
    type: Number,
    required: true
  },
  wrongCount: {
    type: Number,
    required: true
  },
  skippedCount: {
    type: Number,
    required: true
  },
  totalTimeSpentSeconds: {
    type: Number,
    required: true
  },
  avgTimePerQuestionSeconds: {
    type: Number,
    required: true
  },
  negativeMarks: {
    type: Number,
    default: 0
  },
  percentile: {
    type: Number,
    default: 50
  },
  speedRating: {
    type: String,
    enum: ['Fast', 'Optimal', 'Slow'],
    default: 'Optimal'
  },
  consistencyScore: {
    type: Number,
    default: 80
  },
  topicWiseAccuracy: [mongoose.Schema.Types.Mixed],
  chapterWiseAccuracy: [mongoose.Schema.Types.Mixed],
  difficultyWiseAccuracy: [mongoose.Schema.Types.Mixed],
  learningGapScore: {
    type: Number,
    default: 0
  },
  gapPriority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attempt', AttemptSchema);
