// ============================================================================
// SUBJECT ROUTES (subjectRoutes.js)
// ============================================================================
// Why this file exists:
// This file maps incoming HTTP request URLs to the correct controller function.
// Think of it as a table of contents:
// - "If a POST request comes in to /api/subjects, call the createSubject controller"
// - "If a GET request comes in to /api/subjects, call the getSubjects controller"
// etc.
//
// WHY DO WE USE HTTP METHODS (GET, POST, PUT, DELETE)?
// =====================================================
// HTTP Methods are verbs that tell the server WHAT ACTION to perform.
// By using different methods on the SAME URL, we keep our API clean:
//
//   Method  | URL                    | Meaning
//   --------|------------------------|----------------------------------
//   POST    | /api/subjects          | CREATE a new subject
//   GET     | /api/subjects          | READ (fetch) ALL subjects
//   GET     | /api/subjects/:id      | READ (fetch) ONE specific subject
//   PUT     | /api/subjects/:id      | UPDATE a specific subject
//   DELETE  | /api/subjects/:id      | DELETE a specific subject
//
// The ':id' in the URL is a "route parameter" — it's a placeholder that 
// captures the actual ID from the URL. For example, in the URL 
// /api/subjects/abc123, req.params.id would equal "abc123".

const express = require('express');
const router = express.Router();

// Import all 5 controller functions
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');

// Import the 'protect' middleware — ALL subject routes are private!
// You must be logged in with a valid JWT to access any of these endpoints.
const { protect } = require('../middleware/authMiddleware');

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

// ROUTE 1 & 2: /api/subjects (No specific ID needed)
// -----------------------------------------------------------
// Why we use router.route():
// When the SAME URL (/api/subjects) handles multiple HTTP methods, we can chain 
// them together using router.route() to avoid repeating the URL path.
// This is cleaner than writing router.post('/') and router.get('/') separately.
router
  .route('/')
  // POST /api/subjects → Create a brand new subject
  // protect runs first (verifies JWT), THEN createSubject runs
  .post(protect, createSubject)
  // GET /api/subjects → Fetch all subjects belonging to the logged-in user
  .get(protect, getSubjects);

// ROUTE 3, 4 & 5: /api/subjects/:id (A specific subject by its database ID)
// -----------------------------------------------------------
router
  .route('/:id')
  // GET /api/subjects/:id → Fetch the details of ONE specific subject
  .get(protect, getSubjectById)
  // PUT /api/subjects/:id → Update the details of ONE specific subject
  .put(protect, updateSubject)
  // DELETE /api/subjects/:id → Permanently delete ONE specific subject
  .delete(protect, deleteSubject);

module.exports = router;
