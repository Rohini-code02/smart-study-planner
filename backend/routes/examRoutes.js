const express = require('express');
const router = express.Router();
const {
  getExams,
  createExam,
  updateExam,
  deleteExam,
} = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getExams).post(protect, createExam);
router.route('/:id').put(protect, updateExam).delete(protect, deleteExam);

module.exports = router;
