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

const { generateStudyPlan } = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/plan/generate
// Why POST? Because the client is SENDING data (subjects, hours) to the server.
// The server uses that data to generate and RETURN the timetable.
// We do NOT save the plan to the database — it is generated fresh on every request.
router.post('/generate', protect, generateStudyPlan);

module.exports = router;
