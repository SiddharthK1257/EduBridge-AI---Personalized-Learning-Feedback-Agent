const Topic = require('../models/Topic');

// @desc    Get topics (by subject if subjectId query provided)
// @route   GET /api/topics?subjectId=xxx
// @access  Public
const getTopics = async (req, res) => {
  try {
    const { subjectId, subject, chapterId } = req.query;
    const targetSubjectId = subjectId || subject;
    let query = {};
    if (targetSubjectId) {
      query.subject = targetSubjectId;
    }
    if (chapterId) {
      query.chapter = chapterId;
    }
    const topics = await Topic.find(query).populate('subject', 'name').sort({ createdAt: 1, name: 1 });
    return res.json({ success: true, count: topics.length, topics });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create topic (Admin)
// @route   POST /api/topics
// @access  Admin
const createTopic = async (req, res) => {
  try {
    const { subject, subjectId, chapter, name, description } = req.body;
    const targetSubject = subject || subjectId;
    if (!targetSubject || !name) {
      return res.status(400).json({ success: false, message: 'Subject ID and Topic name are required' });
    }
    const topic = await Topic.create({
      subject: targetSubject,
      chapter: chapter || null,
      name,
      description: description || ''
    });
    const populated = await Topic.findById(topic._id).populate('subject', 'name');
    return res.status(201).json({ success: true, topic: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update topic (Admin)
// @route   PUT /api/topics/:id
// @access  Admin
const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('subject', 'name');
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    return res.json({ success: true, topic });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete topic (Admin)
// @route   DELETE /api/topics/:id
// @access  Admin
const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    return res.json({ success: true, message: 'Topic deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic
};
