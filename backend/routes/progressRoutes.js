// ============================================================================
// PROGRESS ROUTES (progressRoutes.js)
// ============================================================================
// Why this file exists:
// Maps the HTTP endpoints for progress tracking to their controller functions.
// ALL routes are PRIVATE — only a logged-in user can view their own stats.
//
// API REFERENCE:
//   Method | URL                       | Feature
//   -------|---------------------------|-------------------------------------------
//   GET    | /api/progress/stats       | Full dashboard statistics summary
//   GET    | /api/progress/weekly      | Day-by-day task completion for the week

const express = require('express');
const router = express.Router();

const { getDashboardStats, getWeeklyBreakdown } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/progress/stats
// Why GET? We are only READING/calculating data, not saving anything new.
// Returns: task counts, percentages, study hours, subject info, upcoming exams
router.get('/stats', protect, getDashboardStats);

// GET /api/progress/weekly
// Returns: day-by-day breakdown of tasks completed this week (for the bar chart)
router.get('/weekly', protect, getWeeklyBreakdown);

module.exports = router;
