// ============================================================================
// USER MODEL (backend/models/User.js)
// ============================================================================
// Why this file exists:
// MongoDB is a "schema-less" database, meaning it will accept ANY data you throw at it.
// That is actually dangerous! Without rules, someone could save a user with no 
// email, a blank name, or duplicate accounts. 
// Mongoose lets us define a strict "schema" (a blueprint) so our data is always 
// consistent, valid, and predictable.

const mongoose = require('mongoose');

// ============================================================================
// USER SCHEMA (The Blueprint)
// ============================================================================
// Why a Schema is created:
// A Schema is like a contract that defines exactly what fields a User document 
// MUST have in our MongoDB database and what rules each field must follow.
const userSchema = new mongoose.Schema(
  {
    // ========================================================================
    // FIELD 1: name
    // ========================================================================
    // EXPLAINING DATA TYPES & REQUIRED FIELDS:
    // - type: String means the database will only accept text for this field. If you 
    //   try to save a number (like 12345), Mongoose will block it or convert it.
    // - required: true means this field CANNOT be empty. If someone tries to sign up 
    //   without providing a name, the database will reject the save and return the 
    //   error message provided.
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true, // Automatically removes extra spaces (e.g., "  Alex  " becomes "Alex")
    },

    // ========================================================================
    // FIELD 2: email
    // ========================================================================
    // EXPLAINING UNIQUE EMAIL VALIDATION:
    // - unique: true is incredibly important! It tells MongoDB to build an "index" 
    //   to ensure no two users can ever have the same email address in the database.
    //   If someone tries to sign up with an existing email, it throws an error.
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true, 
      lowercase: true, // Converts "Alex@Email.COM" to "alex@email.com" to prevent case-sensitive duplicates
      trim: true,
    },

    // ========================================================================
    // FIELD 3: password
    // ========================================================================
    // EXPLAINING PASSWORD STORAGE:
    // We define this as a String, but we NEVER store the user's real, plain-text 
    // password here. Instead, before this is saved to the database, our 'userController.js' 
    // uses 'bcrypt' to hash (scramble) the password into a long, unreadable string.
    // We never store plain-text passwords. For Google OAuth users, password may be null.
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters long'],
    },

    // Google OAuth ID — stored when user signs in with Google
    googleId: {
      type: String,
      required: false,
    },

    // Profile avatar — either a predefined avatar key or a base64 image URL
    avatarUrl: {
      type: String,
      required: false,
      default: '',
    },
  },
  {
    // ========================================================================
    // OPTION: timestamps (createdAt & updatedAt)
    // ========================================================================
    // EXPLAINING TIMESTAMPS:
    // By setting 'timestamps: true', Mongoose automatically handles date-tracking for us.
    // It creates two hidden fields in our database for every user:
    // 1. createdAt: Automatically records the exact moment the user signed up.
    // 2. updatedAt: Automatically updates the exact moment any of the user's data is changed.
    timestamps: true,
  }
);

// ============================================================================
// EXPORTING THE MODEL
// ============================================================================
// We convert our schema blueprint into a real Model called "User".
// Mongoose will use this to automatically create a collection named "users" in our MongoDB database.
const User = mongoose.model('User', userSchema);

module.exports = User;
