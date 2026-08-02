// ============================================================================
// SUBJECT MODEL (backend/models/Subject.js)
// ============================================================================
// Why this file exists:
// A "Subject" is the core data unit of our Smart Study Planner. This file 
// defines the exact blueprint of what a Subject looks like in our MongoDB 
// database — what fields it has, what type of data each field accepts, 
// and what rules each field must follow.

const mongoose = require('mongoose');

// ============================================================================
// SUBJECT SCHEMA (The Blueprint)
// ============================================================================
const subjectSchema = new mongoose.Schema(
  {
    // ========================================================================
    // FIELD 1: user (userId)
    // ========================================================================
    // EXPLAINING OBJECTID & RELATIONSHIPS:
    // In a relational database (like SQL), you link tables using "Foreign Keys".
    // In MongoDB, we use an "ObjectId reference" to create relationships between data.
    // 
    // This 'user' field stores the unique ObjectId of the student who created it.
    // Why is this required? 
    // 1. SECURITY: It ensures a student can ONLY see and edit their own subjects.
    // 2. QUERYING: When we need to fetch a student's dashboard, we simply ask MongoDB: 
    //    "Find all subjects where the 'user' matches this student's ID."
    // 
    // 'ref: User' explicitly tells Mongoose that this ID belongs to the User collection.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subject must belong to a user'],
    },

    // ========================================================================
    // FIELD 2: name (subjectName)
    // ========================================================================
    // Why it exists: The title of the subject (e.g., "Calculus 101" or "History").
    // - type: String ensures it is text.
    // - required: true prevents the user from saving a blank subject.
    name: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true, // Removes accidental leading/trailing spaces (e.g., " Math " -> "Math")
    },

    // ========================================================================
    // FIELD 3: difficulty
    // ========================================================================
    // Why it exists: Helps the app understand how hard the subject is.
    // We use the 'enum' property to strictly limit the allowed values. 
    // If the frontend accidentally sends { difficulty: "Impossible" }, MongoDB 
    // will reject the save because it violates this enum contract!
    difficulty: {
      type: String,
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
      default: 'Medium', // Automatically defaults to 'Medium' if not provided
    },

    // ========================================================================
    // FIELD 4: priority
    // ========================================================================
    // Why it exists: Helps determine the order in which subjects should be studied.
    // A 'High' priority subject will be pushed to the top of the student's task list.
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Normal', 'High'],
        message: 'Priority must be Low, Normal, or High',
      },
      default: 'Normal',
    },

    // ========================================================================
    // FIELD 5: dailyStudyHours
    // ========================================================================
    // Why it exists: Defines how many hours per day the student wants to dedicate.
    // - type: Number ensures they can't type "two hours" (it must be 2).
    // - min and max enforce realistic constraints (e.g., you can't study 25 hours a day).
    dailyStudyHours: {
      type: Number,
      required: false,
      default: 0,
      min: [0, 'Daily study hours cannot be negative'],
      max: [12, 'Daily study hours cannot exceed 12'],
    },
  },
  {
    // ========================================================================
    // OPTION: timestamps (createdAt & updatedAt)
    // ========================================================================
    // EXPLAINING TIMESTAMPS:
    // When this is set to true, Mongoose will silently track the lifecycle of this subject.
    // It auto-injects two fields:
    // 1. createdAt: The exact Date/Time the student hit "Create Subject".
    // 2. updatedAt: The exact Date/Time they last edited the subject (e.g., changed the exam date).
    timestamps: true,
  }
);

// ============================================================================
// EXPORTING THE MODEL
// ============================================================================
// We compile the 'subjectSchema' blueprint into a fully functional Model.
// Mongoose will automatically create a collection called 'subjects' in our database.
const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
