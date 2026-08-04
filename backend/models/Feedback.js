const mongoose = require('mongoose');

const TopicAnalysisSchema = new mongoose.Schema({
  topicName: String,
  accuracy: Number,
  averageTime: Number,
  confidence: Number,
  improvementPercentage: Number,
  masteryScore: Number,
  weaknessScore: Number
});

const ChapterAnalysisSchema = new mongoose.Schema({
  chapterName: String,
  attempted: Number,
  correct: Number,
  wrong: Number,
  accuracy: Number,
  masteryScore: Number,
  revisionPriority: {
    type: String,
    enum: ['High', 'Medium', 'Low']
  },
  estimatedTimeRequiredHours: Number
});

const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: true
  },
  overallGrade: {
    type: String,
    required: true
  },
  strengthsAllowed: { type: Boolean, default: true },
  strengthDetailLevel: { type: String, default: 'Full' },
  weaknessLevel: { type: String, default: 'Moderate' },
  learningGap: { type: String, default: 'Moderate' },
  performanceLevel: { type: String, default: 'Developing' },
  strengths: [String],
  weaknesses: [String],
  learningGaps: [String],
  topicWiseAnalysis: [TopicAnalysisSchema],
  chapterWiseAnalysis: [ChapterAnalysisSchema],
  difficultyWiseAnalysis: [{
    difficulty: String,
    attempted: Number,
    correct: Number,
    wrong: Number,
    accuracy: Number
  }],
  conceptsNeedingRevision: [String],
  mistakeAnalysis: String,
  confidenceScore: Number,
  estimatedStudyHours: { type: Number, default: 5 },
  examReadiness: { type: Number, default: 50 },
  recoveryPlan: mongoose.Schema.Types.Mixed,
  dailyPlanner: mongoose.Schema.Types.Mixed,
  improvementSuggestions: [String],
  studyStrategy: String,
  examTips: [String],
  motivationalFeedback: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
