// ============================================================================
// VERCEL SERVERLESS FUNCTION ENTRY POINT
// ============================================================================
// Vercel needs to import our Express app as a module, not run it as a process.
// This file exports the app so Vercel can handle requests with it.
// For local development, use: node server.js (unchanged)
//
// IMPORTANT: We load dotenv here FIRST before requiring server.js so that all
// environment variables (MONGO_URI, JWT_SECRET) are available when server.js
// runs its imports and connectDB().

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = require('../server');

module.exports = app;
