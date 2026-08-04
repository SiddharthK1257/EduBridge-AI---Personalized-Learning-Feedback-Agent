const express = require('express');
const router = express.Router();
const {
  getUserTestHistory,
  getResultById
} = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

router.get('/user/history', protect, getUserTestHistory);
router.get('/:attemptId', protect, getResultById);

module.exports = router;
