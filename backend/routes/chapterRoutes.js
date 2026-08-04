const express = require('express');
const router = express.Router();
const {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter
} = require('../controllers/chapterController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', getChapters);
router.post('/', protect, adminOnly, createChapter);
router.put('/:id', protect, adminOnly, updateChapter);
router.delete('/:id', protect, adminOnly, deleteChapter);

module.exports = router;
