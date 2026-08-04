const express = require('express');
const router = express.Router();
const {
  generateStudyPlan,
  getMyStudyPlan,
  toggleTaskCompletion
} = require('../controllers/studyPlanController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateStudyPlan);
router.get('/me', protect, getMyStudyPlan);
router.put('/toggle-task', protect, toggleTaskCompletion);

module.exports = router;
