// ============================================================================
// TASK CONTROLLER (taskController.js)
// ============================================================================
// Why this file exists:
// This file is the "brain" of the Task Management system. It contains all the 
// logic for every task-related API: creating, reading, updating, deleting, and 
// toggling completion status.
//
// All routes that use these controllers are PROTECTED, meaning the 'protect' 
// middleware already runs first and attaches the logged-in user to 'req.user'.
// This means we always know WHO is performing the action.

const Task = require('../models/Task');

// ============================================================================
// CONTROLLER 1: createTask (CREATE)
// ============================================================================
// Why this function exists:
// Handles the "Add Task" feature. Receives task data from the React frontend,
// validates it, links it to the logged-in user, and saves it to MongoDB.
const createTask = async (req, res) => {
  const { title, description, dueDate, priority, subject } = req.body;

  // INPUT VALIDATION: Always check required fields before touching the database
  if (!title || !dueDate) {
    return res.status(400).json({ message: 'Please provide a task title and due date' });
  }

  try {
    // Create the task and always attach 'user: req.user._id' to link it to the owner
    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      dueDate,
      priority,
      subject: subject || null, // Subject is optional; if not sent, store null
    });

    // 201 = "Created" — the standard status code when something is successfully created
    res.status(201).json(task);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error while creating task' });
  }
};

// ============================================================================
// CONTROLLER 2: getAllTasks (READ - Get ALL tasks)
// ============================================================================
// Why this function exists:
// Fetches ALL tasks belonging to the logged-in user.
// Used to display the full task list on the dashboard or "My Study Plan" page.
const getAllTasks = async (req, res) => {
  try {
    // Find only tasks belonging to the logged-in user, sorted by closest due date first
    const tasks = await Task.find({ user: req.user._id })
      .sort({ dueDate: 1 }) // 1 = ascending (nearest deadline first)
      .populate('subject', 'name'); // Replaces the subject ID with the subject's actual name

    res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// ============================================================================
// CONTROLLER 3: getPendingTasks (READ - Filter PENDING only)
// ============================================================================
// Why this function exists:
// Powers the "View Pending Tasks" feature on the Study Plan page.
// We filter using { isCompleted: false } so ONLY incomplete tasks are returned.
// Keeping this as a separate endpoint is cleaner than filtering on the frontend.
const getPendingTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      isCompleted: false, // Only return tasks that are NOT yet completed
    })
      .sort({ dueDate: 1 })
      .populate('subject', 'name');

    res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching pending tasks' });
  }
};

// ============================================================================
// CONTROLLER 4: getCompletedTasks (READ - Filter COMPLETED only)
// ============================================================================
// Why this function exists:
// Powers the "View Completed Tasks" feature. Filtering { isCompleted: true } 
// shows only the tasks the user has already finished.
// Seeing completed tasks gives the user a sense of accomplishment and motivation!
const getCompletedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      isCompleted: true, // Only return tasks that HAVE been completed
    })
      .sort({ completedAt: -1 }) // -1 = descending (most recently completed first)
      .populate('subject', 'name');

    res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching completed tasks' });
  }
};

// ============================================================================
// CONTROLLER 5: updateTask (UPDATE)
// ============================================================================
// Why this function exists:
// Handles the "Edit Task" feature. Allows changing the title, description, 
// due date, or priority of an existing task.
// Always verifies existence and ownership before updating.
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // CHECK 1: Does the task exist?
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // CHECK 2: Does this task belong to the logged-in user?
    // Prevents User A from editing User B's tasks!
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this task' });
    }

    // Update the task with new data from the request body
    // { new: true } → returns the updated document, not the old one
    // { runValidators: true } → ensures enum values (like priority) are still valid
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedTask);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error while updating task' });
  }
};

// ============================================================================
// CONTROLLER 6: toggleComplete (MARK COMPLETE / INCOMPLETE)
// ============================================================================
// Why this function exists:
// This is the "Mark Completed" feature — the signature feature of any task manager!
// Instead of replacing the whole task, this controller simply flips the 
// 'isCompleted' boolean between true and false (like ticking a checkbox).
//
// WHY TOGGLE INSTEAD OF JUST SET TO TRUE?
// If a user accidentally marks a task as complete, toggling allows them to 
// UNDO it by clicking the same button again. This is better UX design.
const toggleComplete = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // CHECK 1: Task exists?
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // CHECK 2: The task belongs to the logged-in user?
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this task' });
    }

    // TOGGLE LOGIC:
    // The '!' (NOT operator) flips the boolean value.
    // If isCompleted is currently 'false', it becomes 'true'. And vice versa.
    task.isCompleted = !task.isCompleted;

    // If the task was just COMPLETED, record the exact timestamp
    // If the task was just UN-completed (toggled back), clear the timestamp
    task.completedAt = task.isCompleted ? new Date() : null;

    // Save the updated task back to the database
    await task.save();

    // Send back a clear message and the updated task data
    res.status(200).json({
      message: task.isCompleted ? `"${task.title}" marked as completed! ✅` : `"${task.title}" marked as pending.`,
      task,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while toggling task status' });
  }
};

// ============================================================================
// CONTROLLER 7: deleteTask (DELETE)
// ============================================================================
// Why this function exists:
// Permanently removes a task from the database.
// Performs the standard existence and ownership checks before deletion.
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // CHECK 1: Task exists?
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // CHECK 2: Task belongs to the logged-in user?
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this task' });
    }

    // Permanently remove the task from MongoDB
    await task.deleteOne();

    res.status(200).json({ message: `Task "${task.title}" was successfully deleted` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

// Export all 7 controller functions
module.exports = {
  createTask,
  getAllTasks,
  getPendingTasks,
  getCompletedTasks,
  updateTask,
  toggleComplete,
  deleteTask,
};
