const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const uploadMarksheet = require('../middleware/uploadMiddleware');
const {
  uploadAndExtract,
  saveAndAnalyze,
  getUserMarksheets,
  getMarksheetById,
  deleteMarksheet,
  generateRecoveryPlanController,
  syncToStudyPlanner,
  calculateTargetScore,
  compareMarksheetsController,
  chatWithMentor,
  exportCalendarICS
} = require('../controllers/marksheetController');

// Upload & OCR Extract
router.post('/upload-ocr', protect, uploadMarksheet.single('file'), uploadAndExtract);

// Save & Deep Analyze
router.post('/save-analyze', protect, saveAndAnalyze);

// Compare Marksheets
router.post('/compare', protect, compareMarksheetsController);

// User Marksheets Listing & Single Fetch
router.route('/')
  .get(protect, getUserMarksheets);

router.route('/:id')
  .get(protect, getMarksheetById)
  .delete(protect, deleteMarksheet);

// Recovery Plan & Study Planner Sync & Calendar Export
router.post('/:id/recovery-plan', protect, generateRecoveryPlanController);
router.post('/:id/sync-study-planner', protect, syncToStudyPlanner);
router.get('/:id/export-ics', protect, exportCalendarICS);

// Target Score Calculation
router.post('/:id/target-score', protect, calculateTargetScore);

// Ask AI Mentor About Marksheet
router.post('/:id/chat', protect, chatWithMentor);

module.exports = router;
