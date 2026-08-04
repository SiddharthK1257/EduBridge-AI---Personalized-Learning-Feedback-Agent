const mongoose = require('mongoose');

const ParsedSubjectSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  subjectCode: { type: String, default: '' },
  maxMarks: { type: Number, default: 100 },
  obtainedMarks: { type: Number, default: 0 },
  internalMarks: { type: Number, default: null },
  externalMarks: { type: Number, default: null },
  credits: { type: Number, default: null },
  grade: { type: String, default: '' },
  confidence: { type: String, enum: ['High', 'Medium', 'Low', 'Uncertain'], default: 'High' },
  isUserEdited: { type: Boolean, default: false }
});

const SubjectAnalysisSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  marks: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 100 },
  percentage: { type: Number, default: 0 },
  grade: { type: String, default: '' },
  difficulty: { type: String, default: 'Medium' },
  rank: { type: Number, default: 1 },
  performanceLevel: { 
    type: String, 
    enum: ['Mastery', 'Proficient', 'Developing', 'Critical Focus'], 
    default: 'Developing' 
  },
  weakTopics: [{ type: String }],
  strongTopics: [{ type: String }],
  confidenceLevel: { type: Number, default: 80 },
  estimatedStudyHours: { type: Number, default: 5 },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  improvementPotential: { type: Number, default: 15 },
  improvementRequired: { type: String, default: '' }
});

const TopicAnalysisSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  subjectName: { type: String, required: true },
  topicAccuracy: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
  weakConcepts: [{ type: String }],
  repeatedErrors: [{ type: String }],
  retentionScore: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
  confidence: { type: String, default: 'Medium' },
  hasMockTestData: { type: Boolean, default: false }
});

const ChapterAnalysisSchema = new mongoose.Schema({
  chapterName: { type: String, required: true },
  subjectName: { type: String, required: true },
  accuracy: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
  questionsAttempted: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
  wrongCount: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
  correctCount: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
  improvementNeeded: { type: String, default: 'Requires focused topic practice.' },
  studyTime: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
  hasMockTestData: { type: Boolean, default: false }
});

const EvidenceRecommendationSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  evidence: { type: String, required: true },
  reason: { type: String, required: true },
  confidence: { type: String, enum: ['High', 'Medium', 'Low', 'Uncertain'], default: 'High' },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'High' },
  recommendedStudy: [{ type: String }],
  action: { type: String, required: true },
  expectedImprovement: { type: String, default: '+10 Marks' },
  estimatedStudyHours: { type: Number, default: 5 }
});

const MarksheetAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  
  // OCR Extracted Metadata
  extractedData: {
    studentName: { type: String, default: null },
    rollNumber: { type: String, default: null },
    registrationNumber: { type: String, default: null },
    examName: { type: String, default: null },
    board: { type: String, default: null },
    university: { type: String, default: null },
    college: { type: String, default: null },
    classGrade: { type: String, default: null },
    semester: { type: String, default: null },
    academicYear: { type: String, default: null },
    subjects: [ParsedSubjectSchema],
    cgpa: { type: Number, default: null },
    sgpa: { type: Number, default: null },
    overallPercentage: { type: Number, default: null },
    division: { type: String, default: null },
    status: { type: String, default: 'Pass' },
    remarks: { type: String, default: null },
    rawText: { type: String, default: '' }
  },

  // Deep AI Analysis (Dynamically Computed & Evidence-Based)
  aiAnalysis: {
    overallAcademicSummary: { type: String, default: '' },
    performanceRating: { 
      type: String, 
      enum: ['Outstanding', 'Excellent', 'Good', 'Average', 'Needs Improvement', 'Critical'], 
      required: true 
    },
    overallPercentage: { type: Number, required: true },
    cgpa: { type: Number, default: null },
    overallPercentageAnalysis: { type: String, default: '' },
    cgpaAnalysis: { type: String, default: '' },
    strengths: [{ type: String }],
    weakSubjects: [{ type: String }],
    strongSubjects: [{ type: String }],
    topPriorities: [{ type: String }],
    riskLevel: { 
      type: String, 
      enum: ['Low', 'Moderate', 'High', 'Critical'], 
      default: 'Moderate' 
    },
    subjectRanking: [{
      subjectName: String,
      rank: Number,
      score: Number,
      performanceLevel: String
    }],
    subjectAnalysis: [SubjectAnalysisSchema],
    topicAnalysis: [TopicAnalysisSchema],
    chapterAnalysis: [ChapterAnalysisSchema],
    studyPatternAnalysis: { type: String, default: '' },
    consistencyAnalysis: { type: String, default: '' },
    improvementOpportunities: [{ type: String }],
    examReadinessScore: { type: Number, default: 70 },
    confidenceScore: { type: String, default: 'High' },
    confidenceScoreNumeric: { type: Number, default: 85 },
    learningGapScore: { type: Number, default: 30 },
    estimatedImprovementPotential: { type: Number, default: 15 },
    learningGaps: [{
      subject: String,
      gapDescription: String,
      estimatedStudyTimeHours: Number
    }],
    evidenceBasedRecommendations: [EvidenceRecommendationSchema],
    historicalComparison: {
      hasPreviousHistory: { type: Boolean, default: false },
      previousSemesterScore: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
      currentSemesterScore: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
      previousMockTestAverage: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
      currentPerformanceAverage: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
      improvementPercentage: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
      declinePercentage: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
      consistencyScore: { type: mongoose.Schema.Types.Mixed, default: 'Insufficient verified data.' },
      growthTrend: { type: String, default: 'Insufficient verified data.' },
      strongestSubject: { type: String, default: 'Insufficient verified data.' },
      weakestSubject: { type: String, default: 'Insufficient verified data.' },
      mostImprovedSubject: { type: String, default: 'Insufficient verified data.' },
      needsAttention: { type: String, default: 'Insufficient verified data.' }
    },
    assumptionsUsed: { type: String, default: 'Calculations based on verified marksheet data, MongoDB history, and learning velocity models.' },
    
    // Bonus Features
    bonusFeatures: {
      teacherReport: {
        diagnosticSummary: String,
        pedagogicalAdvice: String,
        classroomInterventions: [String]
      },
      parentReport: {
        academicHealthSummary: String,
        milestonesAchieved: [String],
        homeSupportTips: [String]
      },
      careerSuggestions: [{
        field: String,
        matchPercentage: Number,
        reason: String
      }],
      scholarshipSuggestions: [{
        scholarshipName: String,
        eligibilityStatus: String,
        details: String
      }],
      collegeEligibility: [{
        institution: String,
        status: String,
        requiredCutoff: String
      }],
      skillRecommendations: [String],
      resumeImprovement: [String],
      interviewReadiness: {
        score: Number,
        level: String,
        sampleTechnicalQuestions: [String]
      },
      competitiveExamReadiness: [{
        examName: String,
        estimatedPercentile: String,
        readinessStatus: String
      }],
      calendarEvents: [{
        title: String,
        date: String,
        hours: Number,
        subject: String,
        googleCalendarUrl: String
      }]
    }
  },

  // 1-Click Dynamic Recovery Plan
  recoveryPlan: {
    plan7Days: [{ day: Number, title: String, focus: String, tasks: [String], hours: Number }],
    plan30Days: [{ week: Number, focus: String, goals: [String], targetHours: Number }],
    plan90Days: [{ month: Number, focus: String, milestones: [String] }],
    dailySchedule: [{ timeSlot: String, activity: String, focusSubject: String }],
    weeklySchedule: [{ day: String, focusArea: String, targetHours: Number }],
    monthlyGoals: [String],
    topicPriorities: [{ subject: String, topic: String, priority: String, estimatedHours: Number }],
    chapterPriorities: [{ subject: String, chapter: String, priority: String, estimatedHours: Number }],
    revisionCalendar: [String],
    mockTestSchedule: [String],
    practiceSchedule: [String],
    recoveryScore: { type: Number, default: 75 },
    estimatedTotalStudyHours: { type: Number, default: 40 },
    expectedImprovement: { type: String, default: '+10% to +15% performance gain' }
  },

  // Target Score Calculator Analysis
  targetScoreAnalysis: {
    targetPercentage: Number,
    targetCGPA: Number,
    currentGap: Number,
    requiredMarks: Number,
    dailyStudyHours: Number,
    expectedCompletionDate: String,
    probabilityOfSuccess: String,
    weakTopicsToMaster: [String],
    weeklyGoals: [String],
    suggestedPracticeFrequency: String,
    disclaimer: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MarksheetAnalysis', MarksheetAnalysisSchema);
