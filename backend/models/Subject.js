const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['School', 'Competitive', 'Programming', 'College'],
    default: 'School'
  },
  applicableExams: [{
    type: String
  }],
  applicableGrades: [{
    type: String
  }],
  description: {
    type: String
  },
  icon: {
    type: String,
    default: 'BookOpen'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', SubjectSchema);
