// ============================================================================
// STUDY PLAN MODEL (backend/models/StudyPlan.js)
// ============================================================================
// Why this file exists:
// This file defines the exact structure for saving a "Study Plan" to the database.
// Previously, our planController generated the plan and sent it straight to the 
// user without saving it. By creating this Schema, we can now save a user's 
// daily study plan permanently so they can review past plans or stick to a 
// specific schedule over multiple days!

const mongoose = require('mongoose');

// ============================================================================
// STUDY PLAN SCHEMA (The Blueprint)
// ============================================================================
const studyPlanSchema = new mongoose.Schema(
  {
    // ========================================================================
    // FIELD 1: user (userId)
    // ========================================================================
    // Why it exists: Links this specific Study Plan to the student who requested it.
    // We use an ObjectId reference (Foreign Key) to tie it to the 'User' collection.
    // This ensures that when a student logs in, they only see THEIR generated plans, 
    // keeping their data completely private and secure.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A Study Plan must belong to a user'],
    },

    // ========================================================================
    // FIELD 2: date
    // ========================================================================
    // Why it exists: A student might generate different plans for different days 
    // (e.g., studying 8 hours on Saturday, but only 2 hours on a Tuesday).
    // This Date field records WHICH day this specific plan is intended for.
    date: {
      type: Date,
      required: [true, 'Please provide a date for this study plan'],
      default: Date.now, // Defaults to today's date if not specified
    },

    // ========================================================================
    // FIELD 3: morningSession
    // ========================================================================
    morningSession: [
      {
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
        subjectName: { type: String, required: true },
        priority: { type: String },
        difficulty: { type: String },
        daysUntilExam: { type: Number },
        hoursAllocated: { type: Number, required: true },
        isCompleted: { type: Boolean, default: false },
      }
    ],

    // ========================================================================
    // FIELD 4: afternoonSession
    // ========================================================================
    afternoonSession: [
      {
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
        subjectName: { type: String, required: true },
        priority: { type: String },
        difficulty: { type: String },
        daysUntilExam: { type: Number },
        hoursAllocated: { type: Number, required: true },
        isCompleted: { type: Boolean, default: false },
      }
    ],

    // ========================================================================
    // FIELD 5: eveningSession
    // ========================================================================
    eveningSession: [
      {
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
        subjectName: { type: String, required: true },
        priority: { type: String },
        difficulty: { type: String },
        daysUntilExam: { type: Number },
        hoursAllocated: { type: Number, required: true },
        isCompleted: { type: Boolean, default: false },
      }
    ],

    // ========================================================================
    // FIELD 6: totalHours
    // ========================================================================
    // Why it exists: A quick reference for how many total hours the student committed 
    // to studying on this specific date. 
    // type: Number ensures it is saved as a mathematical number (e.g., 5.5).
    totalHours: {
      type: Number,
      required: [true, 'Please provide the total daily study hours'],
      min: [0.5, 'Total hours must be at least 0.5'],
      max: [24, 'Total hours cannot exceed 24'],
    },
  },
  {
    // ========================================================================
    // OPTION: timestamps (createdAt & updatedAt)
    // ========================================================================
    // EXPLAINING TIMESTAMPS:
    // By setting timestamps to true, Mongoose automatically injects two extra fields:
    // 1. createdAt: The exact timestamp when this plan was first saved to the database.
    // 2. updatedAt: The exact timestamp if the user ever edits the plan later.
    // This is incredibly useful for analytics and auditing without us having to write 
    // extra code to manage the dates!
    timestamps: true,
  }
);

// ============================================================================
// EXPORTING THE MODEL
// ============================================================================
// We compile the 'studyPlanSchema' blueprint into a fully functional Model called 'StudyPlan'.
// Mongoose will automatically create a collection called 'studyplans' in our MongoDB database.
const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

module.exports = StudyPlan;
