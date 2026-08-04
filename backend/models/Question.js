const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  exam: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  explanation: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    default: 'Medium'
  },
  estimatedTimeSeconds: {
    type: Number,
    default: 60
  },
  bloomLevel: {
    type: String,
    enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
    default: 'Apply'
  },
  questionType: {
    type: String,
    default: 'Standard MCQ'
  },
  conceptTested: {
    type: String,
    default: 'Core Subject Concepts'
  },
  topicName: {
    type: String
  },
  chapterName: {
    type: String
  },
  board: {
    type: String,
    default: 'CBSE'
  },
  learningObjective: {
    type: String,
    default: 'Master foundational principles'
  },
  correctAnswer: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isAiGenerated: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', QuestionSchema);
