const Chapter = require('../models/Chapter');

// @desc    Get chapters (by subject if subjectId query provided)
// @route   GET /api/chapters?subjectId=xxx
// @access  Public
const getChapters = async (req, res) => {
  try {
    const { subjectId, subject } = req.query;
    const targetSubjectId = subjectId || subject;
    let query = {};
    if (targetSubjectId) {
      query.subject = targetSubjectId;
    }
    const chapters = await Chapter.find(query).populate('subject', 'name').sort({ createdAt: 1, name: 1 });
    return res.json({ success: true, count: chapters.length, chapters });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create chapter (Admin)
// @route   POST /api/chapters
// @access  Admin
const createChapter = async (req, res) => {
  try {
    const { subject, subjectId, name, description } = req.body;
    const targetSubject = subject || subjectId;
    if (!targetSubject || !name) {
      return res.status(400).json({ success: false, message: 'Subject ID and Chapter name are required' });
    }
    const chapter = await Chapter.create({ subject: targetSubject, name, description: description || '' });
    const populated = await Chapter.findById(chapter._id).populate('subject', 'name');
    return res.status(201).json({ success: true, chapter: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update chapter (Admin)
// @route   PUT /api/chapters/:id
// @access  Admin
const updateChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('subject', 'name');
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    return res.json({ success: true, chapter });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete chapter (Admin)
// @route   DELETE /api/chapters/:id
// @access  Admin
const deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    return res.json({ success: true, message: 'Chapter deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter
};
