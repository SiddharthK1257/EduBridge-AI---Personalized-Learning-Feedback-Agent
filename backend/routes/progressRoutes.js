const express = require('express');
const router = express.Router();
const { getMyProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyProgress);

module.exports = router;
