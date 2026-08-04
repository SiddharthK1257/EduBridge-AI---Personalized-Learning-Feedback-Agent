const mongoose = require('mongoose');

const DailyTaskSchema = new mongoose.Schema({
  timeSlot: String,
  activity: String,
  topicOrChapter: String,
  completed: {
    type: Boolean,
    default: false
  }
});

const WeeklyTaskSchema = new mongoose.Schema({
  week: String,
  focusArea: String,
  targetHours: Number,
  taskCount: Number
});

const PriorityTopicSchema = new mongoose.Schema({
  topicName: String,
  subject: String,
  priority: String,
  difficulty: String,
  estimatedHours: Number
});

const RevisionTaskSchema = new mongoose.Schema({
  day: String,
  focus: String,
  topics: [String]
});

const MockTestScheduleSchema = new mongoose.Schema({
  testName: String,
  date: String,
  focus: String
});

const HealthTipsSchema = new mongoose.Schema({
  sleepRecommendation: String,
  breakTimings: String,
  waterReminder: String,
  exerciseRecommendation: String,
  meditationTime: String
});

const Last7DaysPlanSchema = new mongoose.Schema({
  day: String,
  task: String
});

const HealthyHabitSchema = new mongoose.Schema({
  sleepTime: String,
  wakeTime: String,
  exerciseTime: String,
  waterReminder: String,
  meditationTime: String,
  screenBreakInterval: String,
  healthyHabits: [String]
});

const StudyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  examDate: {
    type: Date,
    required: true
  },
  availableHoursPerDay: {
    type: Number,
    required: true
  },
  targetScore: {
    type: Number,
    required: true
  },
  subject: {
    type: String,
    default: 'General'
  },
  topics: [String],
  weakAreas: [String],
  overview: {
    daysRemaining: Number,
    targetScore: Number,
    dailyStudyHours: Number,
    examTarget: String
  },
  dailyPlan: [DailyTaskSchema],
  weeklyPlan: [WeeklyTaskSchema],
  priorityTopics: [PriorityTopicSchema],
  revisionPlan: [RevisionTaskSchema],
  mockTests: [MockTestScheduleSchema],
  healthTips: HealthTipsSchema,
  healthyRoutine: HealthyHabitSchema,
  examTips: [String],
  motivation: [String],
  last7DaysPlan: [Last7DaysPlanSchema],
  generatedFromMockTest: {
    type: Boolean,
    default: false
  },
  triggerMockTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest'
  },
  triggerMockTestTitle: String,
  triggerMockTestScore: Number,
  triggerMockTestAccuracy: Number,
  triggerMockTestDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
