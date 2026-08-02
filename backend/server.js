// ============================================================================
// MAIN SERVER FILE (server.js)
// ============================================================================
// Why this file exists:
// This is the absolute starting point of our entire backend application. 
// When we start the server, this is the file that Node.js reads first.

// 1. IMPORTING REQUIRED PACKAGES
// ============================================================================
// Express is our web framework that makes creating APIs easy.
const express = require('express');

// CORS (Cross-Origin Resource Sharing) allows our React frontend 
// to securely talk to our Express backend. 
// DEPLOYMENT NOTE: In production, you should restrict this to your actual frontend domain!
const cors = require('cors');

// dotenv loads the secret variables from our .env file into 'process.env'
// DEPLOYMENT NOTE: In production (like Heroku or Render), you won't use a .env file.
// Instead, you will set these Environment Variables directly in their dashboard.
const dotenv = require('dotenv');

// We import our custom database connection function from the config folder
const connectDB = require('./config/db');

// 2. CONFIGURATION
// ============================================================================
// Load environment variables immediately so we can securely use them below
dotenv.config();

// Create the actual Express application object
const app = express();

// Execute the function to securely connect to MongoDB.
// In a serverless environment (Vercel), we must make sure the database is fully 
// connected BEFORE we process any routes. We do this by adding a global middleware.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// 3. MIDDLEWARE
// ============================================================================
// Why middleware exists:
// Middleware are helper functions that run 'in the middle' of every single request 
// before it actually reaches our routes.

// Enable CORS so React can safely talk to us
// DEPLOYMENT TIP: To secure your app in production, change this to:
// app.use(cors({ origin: 'https://your-frontend-domain.com' }));
app.use(cors());

// Enable JSON parsing. This allows our server to understand JSON data 
// sent from the frontend (like the name/email data from our Signup form!)
app.use(express.json());

// 4. ROUTES
// ============================================================================
// Why routes exist:
// Routes define the URLs (endpoints) that the frontend can visit to get data.

// Import our user authentication routes
const userRoutes = require('./routes/userRoutes');

// Import our subject management routes
const subjectRoutes = require('./routes/subjectRoutes');

// Import our task management routes
const taskRoutes = require('./routes/taskRoutes');

// Import our exam management routes
const examRoutes = require('./routes/examRoutes');

// Import our study plan generation routes
const planRoutes = require('./routes/planRoutes');

// Import our progress tracking routes
const progressRoutes = require('./routes/progressRoutes');

// A simple test route to make sure the server is alive and functioning
app.get('/', (req, res) => {
  // We send back a JSON response
  res.json({ message: 'Welcome to the Smart Study Planner API! 🚀' });
});

// Mount the user routes at /api/users
// All routes inside userRoutes.js will be prefixed with /api/users
// For example: POST /api/users/signup, POST /api/users/login
app.use('/api/users', userRoutes);

// Mount the subject routes at /api/subjects
// All routes inside subjectRoutes.js will be prefixed with /api/subjects
// For example: GET /api/subjects, POST /api/subjects, DELETE /api/subjects/:id
app.use('/api/subjects', subjectRoutes);

// Mount the task routes at /api/tasks
// All routes inside taskRoutes.js will be prefixed with /api/tasks
// For example: POST /api/tasks, GET /api/tasks/pending, PATCH /api/tasks/:id/toggle
app.use('/api/tasks', taskRoutes);

// Mount the exam routes at /api/exams
app.use('/api/exams', examRoutes);

// Mount the study plan generation routes at /api/plan
// For example: POST /api/plan/generate
app.use('/api/plan', planRoutes);

// Mount the progress tracking routes at /api/progress
// For example: GET /api/progress/stats, GET /api/progress/weekly
app.use('/api/progress', progressRoutes);

// 5. STARTING THE SERVER
// ============================================================================
// We dynamically get the port from the .env file, or default to 5000 if it's missing.
const PORT = process.env.PORT || 5000;

// Only start the HTTP server when running locally (node server.js).
// On Vercel, the app is exported as a serverless function — app.listen is NOT called.
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running smoothly on http://localhost:${PORT}`);
  });
}

// Export the app so Vercel's serverless function (backend/api/index.js) can use it.
module.exports = app;

