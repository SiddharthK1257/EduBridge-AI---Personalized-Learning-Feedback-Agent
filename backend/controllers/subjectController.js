const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Chapter = require('../models/Chapter');
const seedDatabase = require('../utils/seedData');

// @desc    Get all subjects (filtered by exam/grade/category if provided)
// @route   GET /api/subjects
// @access  Public
const getSubjects = async (req, res) => {
  try {
    let count = await Subject.countDocuments();
    if (count === 0) {
      console.log('[SubjectController] Database is empty. Seeding catalog automatically...');
      await seedDatabase();
    }

    const { exam, grade, category } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    let filterConditions = [];

    if (exam) {
      const examRegex = new RegExp(exam, 'i');
      filterConditions.push(
        { applicableExams: { $regex: examRegex } },
        { name: { $regex: examRegex } }
      );
      // Programming subjects check
      const programmingExams = ['Java', 'Python', 'JavaScript', 'DBMS', 'Operating Systems', 'Computer Networks', 'Data Structures', 'Algorithms'];
      if (programmingExams.some(p => p.toLowerCase() === exam.toLowerCase())) {
        filterConditions.push({ category: 'Programming' });
      }
    }

    if (grade) {
      const gradeRegex = new RegExp(grade, 'i');
      filterConditions.push(
        { applicableGrades: { $regex: gradeRegex } },
        { applicableGrades: 'Not Applicable' },
        { applicableGrades: 'N/A' }
      );
    }

    if (filterConditions.length > 0) {
      query.$or = filterConditions;
    }

    let subjects = await Subject.find(query).sort({ name: 1 });

    // Fallback: If filtered result is empty, return all subjects
    if (!subjects || subjects.length === 0) {
      subjects = await Subject.find({}).sort({ name: 1 });
    }

    return res.json({ success: true, count: subjects.length, subjects });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create subject (Admin)
// @route   POST /api/subjects
// @access  Admin
const createSubject = async (req, res) => {
  try {
    const { name, category, applicableExams, applicableGrades, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }
    const subject = await Subject.create({
      name,
      category: category || 'School',
      applicableExams: Array.isArray(applicableExams) ? applicableExams : (applicableExams ? [applicableExams] : []),
      applicableGrades: Array.isArray(applicableGrades) ? applicableGrades : (applicableGrades ? [applicableGrades] : []),
      description: description || '',
      icon: icon || 'BookOpen'
    });
    return res.status(201).json({ success: true, subject });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update subject (Admin)
// @route   PUT /api/subjects/:id
// @access  Admin
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    return res.json({ success: true, subject });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete subject (Admin)
// @route   DELETE /api/subjects/:id
// @access  Admin
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    await Topic.deleteMany({ subject: req.params.id });
    await Chapter.deleteMany({ subject: req.params.id });
    return res.json({ success: true, message: 'Subject and associated topics/chapters deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};
