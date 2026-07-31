// ============================================================================
// DATABASE CONFIGURATION (config/db.js)
// ============================================================================
// Why this file exists:
// This file handles the complex logic for connecting our Node.js server to 
// our MongoDB database (Atlas). By keeping it in the 'config' folder, our main 
// server.js stays clean and organized.

// ============================================================================
// 1. IMPORTING MONGOOSE
// ============================================================================
// We import 'mongoose', which is an Object Data Modeling (ODM) library for MongoDB.
const mongoose = require('mongoose');

// ============================================================================
// 2. THE CONNECTION FUNCTION
// ============================================================================
// Why this function exists:
// It attempts to connect to the database securely. It is an "async" function 
// because connecting over the internet takes time, and we have to "await" the result.
const connectDB = async () => {
  try {
    // ========================================================================
    // EXPLAINING ENVIRONMENT VARIABLES & MONGOOSE.CONNECT()
    // ========================================================================
    // ENVIRONMENT VARIABLES (process.env):
    // A database connection string contains a secret username and password. 
    // We NEVER hardcode secrets into this file because anyone looking at our code 
    // (e.g., on GitHub) could steal them. Instead, we store them in a hidden '.env' 
    // file, which Node.js accesses using 'process.env.MONGO_URI'.
    //
    // WHY WE USE mongoose.connect():
    // Instead of using the native, complex MongoDB driver, we use Mongoose. 
    // mongoose.connect() abstracts away all the complicated network logic and 
    // establishes a stable, persistent connection to your Cloud Cluster. It also 
    // enables us to use Models and Schemas to easily validate our data later!
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // ========================================================================
    // 3. SUCCESSFUL CONNECTION HANDLING
    // ========================================================================
    // If successful, log the connection host to the terminal so we know it worked!
    // conn.connection.host tells us EXACTLY which Atlas server we connected to.
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    
  } catch (error) {
    // ========================================================================
    // 4. ERROR HANDLING
    // ========================================================================
    // If the connection fails (e.g., wrong password, internet down, or network 
    // access not whitelisted), it immediately jumps to this 'catch' block.
    
    // We log the exact error message so we can debug what went wrong.
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // process.exit(1) forcibly kills the Node.js server. 
    // Why? If our app relies on a database to work, and the database is unreachable, 
    // the app shouldn't run at all because it will just crash users' requests.
    process.exit(1);
  }
};

// ============================================================================
// 5. EXPORTING THE FUNCTION
// ============================================================================
// We export this function so we can import it into server.js and trigger 
// the connection when the app starts.
module.exports = connectDB;
