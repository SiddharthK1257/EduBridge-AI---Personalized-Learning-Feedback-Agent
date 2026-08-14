const express = require('express');
const router = express.Router();
const {
  generateTest,
  getTestById,
  submitTest,
  chatWithTestMentorController,
  generateDrillTest,
  submitDrillTest
} = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateTest);
router.post('/drill/generate', protect, generateDrillTest);
router.post('/drill/submit', protect, submitDrillTest);
router.get('/:id', protect, getTestById);
router.post('/submit', protect, submitTest);
router.post('/mentor/chat', protect, chatWithTestMentorController);

module.exports = router;
