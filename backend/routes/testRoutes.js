const express = require('express');
const router = express.Router();
const {
  generateTest,
  getTestById,
  submitTest,
  chatWithTestMentorController
} = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateTest);
router.get('/:id', protect, getTestById);
router.post('/submit', protect, submitTest);
router.post('/mentor/chat', protect, chatWithTestMentorController);

module.exports = router;
