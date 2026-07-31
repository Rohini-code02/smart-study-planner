// ============================================================================
// DATABASE CONFIGURATION (config/db.js)
// ============================================================================
// Why this file exists:
// This file handles the logic for connecting our Node.js server to MongoDB Atlas.
// It also implements connection caching, which is CRITICAL for serverless (Vercel).
//
// WHY CONNECTION CACHING?
// In a traditional server, mongoose.connect() is called ONCE at startup and 
// the connection stays alive. But Vercel serverless functions are stateless —
// each request could spin up a fresh function instance. Without caching, 
// every single API call would try to open a NEW MongoDB connection, quickly
// exhausting the Atlas connection limit and slowing down every request.
// By caching the connection on the global object, we reuse it across invocations.

const mongoose = require('mongoose');

// Use a module-level cache to avoid reconnecting on every serverless invocation
let cachedConnection = null;

const connectDB = async () => {
  // If we already have a live connection, reuse it (serverless performance optimization)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options prevent deprecation warnings and ensure stable connections
      bufferCommands: false, // Disable mongoose command buffering for serverless
    });
    
    cachedConnection = conn;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // In serverless (Vercel), process.exit() is NOT safe — it would crash the entire function.
    // Instead, we throw the error so the caller can handle it gracefully.
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
