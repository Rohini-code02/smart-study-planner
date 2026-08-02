// ============================================================================
// SUBJECT CONTROLLER (subjectController.js)
// ============================================================================
// Why this file exists:
// The controller contains the actual LOGIC for every Subject API.
// Keeping business logic here (instead of directly in routes) keeps our 
// code clean, organized, and easy to maintain and test.
//
// WHAT IS CRUD?
// ==============
// CRUD stands for the 4 fundamental operations performed on ANY data:
// C → CREATE   → Add a new subject to the database           (POST)
// R → READ     → Get/View subjects from the database         (GET)
// U → UPDATE   → Edit/Modify an existing subject             (PUT)
// D → DELETE   → Remove a subject from the database          (DELETE)
// Every API in the world is built on some combination of these 4 operations!

const Subject = require('../models/Subject');

// ============================================================================
// CONTROLLER 1: createSubject (CREATE)
// ============================================================================
// Why this controller exists:
// This runs when the user submits our React "Subject Setup" form.
// It takes the form data, validates it, and saves a new Subject to MongoDB.
// Because this is a PROTECTED route, req.user is already attached by our 
// authMiddleware — so we know exactly WHO is creating the subject.
const createSubject = async (req, res) => {
  const { name, difficulty, priority } = req.body;

  // Only name is required — difficulty and priority have defaults
  if (!name) {
    return res.status(400).json({ message: 'Please provide a subject name' });
  }

  try {
    const subject = await Subject.create({
      user: req.user._id,
      name,
      difficulty: difficulty || 'Medium',
      priority: priority || 'Normal',
    });

    res.status(201).json(subject);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error while creating subject' });
  }
};

// ============================================================================
// CONTROLLER 2: getSubjects (READ - Get ALL)
// ============================================================================
// Why this controller exists:
// This runs when the React Dashboard or "My Study Plan" page loads and needs 
// to display all of the user's subjects.
// We use .find({ user: req.user._id }) to ONLY return subjects belonging to 
// the currently logged-in user — never mixing data between different users!
const getSubjects = async (req, res) => {
  try {
    // Find all subjects where the 'user' field matches the logged-in user's ID
    // .sort({ examDate: 1 }) sorts them with the nearest exam first (ascending order)
    const subjects = await Subject.find({ user: req.user._id }).sort({ examDate: 1 });

    // Send back a 200 "OK" status with the array of subjects
    res.status(200).json(subjects);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching subjects' });
  }
};

// ============================================================================
// CONTROLLER 3: getSubjectById (READ - Get ONE)
// ============================================================================
// Why this controller exists:
// Gets the full details of a single specific subject (e.g., when a user 
// clicks on a subject card to view or edit it). The subject ID comes from 
// the URL (e.g., /api/subjects/abc123).
const getSubjectById = async (req, res) => {
  try {
    // req.params.id is the subject ID extracted from the URL
    const subject = await Subject.findById(req.params.id);

    // SECURITY CHECK: Make sure the subject actually exists
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // OWNERSHIP CHECK: Make sure the logged-in user OWNS this subject.
    // We compare the subject's user ID (from DB) with the logged-in user's ID.
    // .toString() converts both MongoDB ObjectIds to plain strings for comparison.
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to view this subject' });
    }

    res.status(200).json(subject);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching subject' });
  }
};

// ============================================================================
// CONTROLLER 4: updateSubject (UPDATE)
// ============================================================================
// Why this controller exists:
// Runs when the user edits a subject (e.g., changes the exam date or priority).
// We use findById first to confirm the subject exists AND the user owns it 
// before making any changes to the database.
const updateSubject = async (req, res) => {
  try {
    // First, find the subject by its ID
    const subject = await Subject.findById(req.params.id);

    // CHECK 1: Does the subject exist?
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // CHECK 2: Does this subject belong to the logged-in user?
    // Prevents a malicious user from editing someone else's subjects!
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this subject' });
    }

    // UPDATE: Find the subject by ID and update it with the new data from req.body.
    // { new: true } → returns the UPDATED document instead of the old one.
    // { runValidators: true } → re-runs the schema validations (e.g., enum checks) on update.
    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedSubject);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error while updating subject' });
  }
};

// ============================================================================
// CONTROLLER 5: deleteSubject (DELETE)
// ============================================================================
// Why this controller exists:
// Runs when the user deletes a subject from their planner.
// We perform the same existence and ownership checks before permanently 
// removing the document from the database.
const deleteSubject = async (req, res) => {
  try {
    // Find the subject first to verify it exists
    const subject = await Subject.findById(req.params.id);

    // CHECK 1: Does the subject exist?
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // CHECK 2: Does this subject belong to the logged-in user?
    if (subject.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this subject' });
    }

    // DELETE: Permanently remove the subject from the database
    await subject.deleteOne();

    // Send a success message confirming deletion
    res.status(200).json({ message: `Subject "${subject.name}" was successfully deleted` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting subject' });
  }
};

// Export all 5 controller functions to be used in our routes file
module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
