// ============================================================================
// STUDY PLAN ROUTES (planRoutes.js)
// ============================================================================
// Why this file exists:
// Maps the HTTP endpoint for study plan generation to the controller function.
// We use the 'protect' middleware so only logged-in users can generate a plan.
//
// API REFERENCE:
//   Method | URL                  | Feature
//   -------|----------------------|-------------------------------
//   POST   | /api/plan/generate   | Generate a full study timetable

const express = require('express');
const router = express.Router();

const { generateStudyPlan, getLatestPlan, updateCustomPlan, toggleSlotStatus } = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/plan/generate
// Why POST? Because the client is SENDING data (subjects, hours) to the server.
// The server uses that data to generate and RETURN the timetable.
// We do NOT save the plan to the database — it is generated fresh on every request.
router.post('/generate', protect, generateStudyPlan);

// GET /api/plan/latest
// Fetch the most recently saved study plan for the logged-in user
router.get('/latest', protect, getLatestPlan);

// PUT /api/plan/custom
// Update the user's latest saved plan with custom changes
router.put('/custom', protect, updateCustomPlan);

// PATCH /api/plan/:planId/toggle-slot/:slotId
// Toggle completion status of a specific slot in the plan
router.patch('/:planId/toggle-slot/:slotId', protect, toggleSlotStatus);

module.exports = router;
