const Subject = require('../models/Subject');

// CREATE subject
const createSubject = async (req, res) => {
  const { name, difficulty } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Please provide a subject name' });
  }

  try {
    const subject = await Subject.create({
      user: req.user._id,
      name,
      difficulty: difficulty || 'Medium',
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ message: error.message || 'Server error while creating subject' });
  }
};

// READ all subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Server error while fetching subjects' });
  }
};

// READ single subject
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.status(200).json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ message: 'Server error while fetching subject' });
  }
};

// UPDATE subject
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, difficulty: req.body.difficulty || 'Medium' },
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedSubject);
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ message: error.message || 'Server error while updating subject' });
  }
};

// DELETE subject
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await subject.deleteOne();
    res.status(200).json({ message: `Subject "${subject.name}" deleted` });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Server error while deleting subject' });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
