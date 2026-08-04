const express = require('express');
const router = express.Router();
const {
  getStudents,
  updateUser,
  deleteUser,
  getQuestions,
  createQuestion,
  deleteQuestion,
  getSystemAnalytics
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/users', getStudents);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.delete('/questions/:id', deleteQuestion);

router.get('/analytics', getSystemAnalytics);

module.exports = router;
