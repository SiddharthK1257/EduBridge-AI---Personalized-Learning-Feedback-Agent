const express = require('express');
const router = express.Router();
const {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic
} = require('../controllers/topicController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', getTopics);
router.post('/', protect, adminOnly, createTopic);
router.put('/:id', protect, adminOnly, updateTopic);
router.delete('/:id', protect, adminOnly, deleteTopic);

module.exports = router;
