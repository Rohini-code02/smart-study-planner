const Exam = require('../models/Exam');

const getExams = async (req, res) => {
  try {
    const exams = await Exam.find({ user: req.user._id }).populate('subject');
    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams' });
  }
};

const createExam = async (req, res) => {
  const { title, date, subject, syllabus } = req.body;
  
  if (!title || !date) {
    return res.status(400).json({ message: 'Title and date are required' });
  }

  // Server-side date validation
  if (new Date(date) < new Date(new Date().setHours(0,0,0,0))) {
    return res.status(400).json({ message: 'Exam date cannot be in the past' });
  }

  try {
    const exam = await Exam.create({
      title,
      date,
      subject: subject || null,
      syllabus,
      user: req.user._id,
    });
    const populatedExam = await Exam.findById(exam._id).populate('subject');
    res.status(201).json(populatedExam);
  } catch (error) {
    res.status(500).json({ message: 'Error creating exam' });
  }
};

const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    if (req.body.date && new Date(req.body.date) < new Date(new Date().setHours(0,0,0,0))) {
      return res.status(400).json({ message: 'Exam date cannot be in the past' });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('subject');

    res.status(200).json(updatedExam);
  } catch (error) {
    res.status(500).json({ message: 'Error updating exam' });
  }
};

const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await exam.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exam' });
  }
};

module.exports = {
  getExams,
  createExam,
  updateExam,
  deleteExam,
};
