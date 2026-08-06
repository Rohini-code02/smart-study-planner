// ============================================================================
// PROGRESS MODEL (backend/models/Progress.js)
// ============================================================================
// Why this file exists:
// In many apps, progress is calculated "on-the-fly" by constantly counting 
// completed tasks vs pending tasks every single time the user opens the dashboard.
// 
// WHY IS PROGRESS STORED IN A SCHEMA?
// If a user has 10,000 tasks, counting them every time they open the app would 
// be incredibly slow and crash the server! By creating this Progress Model, we can 
// save (or "cache") a summary of their progress. We just update this tiny summary 
// document whenever they finish a task, making the dashboard load instantly!

const mongoose = require('mongoose');

// ============================================================================
// PROGRESS SCHEMA (The Blueprint)
// ============================================================================
const progressSchema = new mongoose.Schema(
  {
    // ========================================================================
    // FIELD 1: user (userId)
    // ========================================================================
    // Why it exists: Links this specific Progress record to a specific student.
    // - type: ObjectId ensures it perfectly matches a real user's ID in MongoDB.
    // - ref: 'User' tells MongoDB this ID belongs to the User collection.
    // - unique: true ensures one user only ever has ONE progress summary record!
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Progress must belong to a user'],
      unique: true, 
    },

    // ========================================================================
    // FIELD 2: completedTasks
    // ========================================================================
    // Why it exists: A running tally of how many tasks the user has finished.
    // - type: Number because it is a mathematical count. 
    // - default: 0 ensures new users start at zero without errors.
    completedTasks: {
      type: Number,
      default: 0,
    },

    // ========================================================================
    // FIELD 3: pendingTasks
    // ========================================================================
    // Why it exists: A running tally of how many tasks the user still needs to do.
    // - type: Number ensures we can do math with it (e.g., pendingTasks + completedTasks = total).
    pendingTasks: {
      type: Number,
      default: 0,
    },

    // ========================================================================
    // FIELD 4: totalStudyHours
    // ========================================================================
    // Why it exists: Keeps track of the planned total number of hours the user 
    // has from their generated study plan.
    // - type: Number allows decimals (e.g., 1.5 hours).
    totalStudyHours: {
      type: Number,
      default: 0,
    },

    // ========================================================================
    // FIELD: actualStudyHours
    // ========================================================================
    // Why it exists: Keeps track of actual hours tracked via the Pomodoro Timer.
    actualStudyHours: {
      type: Number,
      default: 0,
    },

    // ========================================================================
    // FIELD 5: progressPercentage
    // ========================================================================
    // Why it exists: A calculated number from 0 to 100 representing the user's 
    // overall completion rate. It powers the circular progress bar on the dashboard.
    // - type: Number ensures it can be used directly in frontend UI components.
    // - min/max: Enforces that a percentage can never be lower than 0 or higher than 100.
    progressPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Percentage cannot be below 0'],
      max: [100, 'Percentage cannot exceed 100'],
    },
  },
  {
    // ========================================================================
    // OPTION: timestamps (createdAt & updatedAt)
    // ========================================================================
    // Why it exists: Mongoose auto-injects 'createdAt' and 'updatedAt'.
    // Every time the user completes a task and this progress summary is updated, 
    // the 'updatedAt' timestamp automatically changes, letting us know exactly 
    // when they were last active!
    timestamps: true,
  }
);

// ============================================================================
// EXPORTING THE MODEL
// ============================================================================
// We compile the 'progressSchema' blueprint into a fully functional Model called 'Progress'.
// Mongoose will automatically create a collection called 'progresses' in our MongoDB database.
const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
