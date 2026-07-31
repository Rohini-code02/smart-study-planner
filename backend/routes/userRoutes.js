// ============================================================================
// USER ROUTES (userRoutes.js)
// ============================================================================
// Why this file exists:
// This file acts as a "traffic cop". It listens for incoming HTTP requests at 
// specific URL paths and directs them to the correct controller function.
// By keeping routing separate from business logic, our code stays clean.

const express = require('express');

// express.Router() creates a mini-application that can handle its own set of routes.
// Think of it as a dedicated section of routes just for users.
const router = express.Router();

// Import the controller functions that contain the actual logic
const { 
  signupUser, 
  loginUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword
} = require('../controllers/userController');

// Import the protect middleware for the private "me" route
const { protect } = require('../middleware/authMiddleware');

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

// PUBLIC ROUTES (Anyone can access these)
// -----------------------------------------------------------------------

// POST /api/users/signup
// Why this route exists: 
// This is the endpoint our React Signup page will call when a user submits the form.
// 'POST' is used because we are sending data TO the server to CREATE a new resource.
router.post('/signup', signupUser);

// POST /api/users/login
// Why this route exists:
// This is the endpoint our React Login page calls when a user submits their credentials.
router.post('/login', loginUser);

// PRIVATE ROUTES (Only logged-in users with a valid JWT can access)
// -----------------------------------------------------------------------

// GET /api/users/me
// Why this route exists:
// This is a protected "profile" endpoint. The 'protect' middleware runs FIRST 
// and verifies the JWT. If valid, it calls the getUserProfile controller.
router.get('/me', protect, getUserProfile);

// PUT /api/users/me
// Why this route exists:
// Allows the logged-in user to update their basic profile info (name, email).
router.put('/me', protect, updateUserProfile);

// PUT /api/users/password
// Why this route exists:
// A dedicated endpoint for changing the password securely.
router.put('/password', protect, changeUserPassword);

// We export the router to be used in server.js
module.exports = router;
