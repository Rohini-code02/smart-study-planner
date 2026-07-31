// ============================================================================
// TASK ROUTES (taskRoutes.js)
// ============================================================================
// Why this file exists:
// This file maps every incoming HTTP request URL to the correct controller function.
// ALL routes here are PRIVATE — every single one requires a valid JWT token.
// The 'protect' middleware acts as the security guard on every route.
//
// COMPLETE API REFERENCE:
// ========================
//   Method | URL                         | Feature
//   -------|-----------------------------|--------------------------
//   POST   | /api/tasks                  | Add a new task
//   GET    | /api/tasks                  | View ALL tasks
//   GET    | /api/tasks/pending          | View PENDING tasks only
//   GET    | /api/tasks/completed        | View COMPLETED tasks only
//   PUT    | /api/tasks/:id              | Edit a specific task
//   PATCH  | /api/tasks/:id/toggle       | Mark complete / incomplete
//   DELETE | /api/tasks/:id              | Delete a specific task
//
// NOTE: We use PATCH (not PUT) for toggleComplete.
// WHY? Because PUT means "replace the whole object with new data".
//      PATCH means "make a small, partial change". Flipping one boolean 
//      (isCompleted) is a partial change — so PATCH is the correct semantic choice!

const express = require('express');
const router = express.Router();

// Import all 7 controller functions from our task controller
const {
  createTask,
  getAllTasks,
  getPendingTasks,
  getCompletedTasks,
  updateTask,
  toggleComplete,
  deleteTask,
} = require('../controllers/taskController');

// Import the protect middleware — required on every route
const { protect } = require('../middleware/authMiddleware');

// ============================================================================
// SPECIFIC FILTER ROUTES (Must be defined BEFORE the /:id routes!)
// ============================================================================
// Why define these first?
// Express reads routes from TOP to BOTTOM. If we put '/:id' before '/pending',
// Express would mistakenly treat the word "pending" as an ID parameter!
// By placing specific named routes first, we avoid this routing conflict.

// GET /api/tasks/pending → Fetch only the tasks not yet completed
router.get('/pending', protect, getPendingTasks);

// GET /api/tasks/completed → Fetch only the tasks that have been completed
router.get('/completed', protect, getCompletedTasks);

// ============================================================================
// BASE ROUTES: /api/tasks
// ============================================================================

router
  .route('/')
  // POST /api/tasks → Create a brand new task
  .post(protect, createTask)
  // GET /api/tasks → Get all tasks for the logged-in user
  .get(protect, getAllTasks);

// ============================================================================
// INDIVIDUAL TASK ROUTES: /api/tasks/:id
// ============================================================================

router
  .route('/:id')
  // PUT /api/tasks/:id → Edit the details of one specific task
  .put(protect, updateTask)
  // DELETE /api/tasks/:id → Permanently remove one specific task
  .delete(protect, deleteTask);

// PATCH /api/tasks/:id/toggle → Flip the isCompleted status (Mark done/undone)
// Why a separate URL (/toggle)?
// The /:id route handles full edits. The /toggle route does ONE specific action.
// Keeping them separate makes the API self-documenting and easier to understand.
router.patch('/:id/toggle', protect, toggleComplete);

module.exports = router;
