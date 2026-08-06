// ============================================================================
// TASK MODEL (backend/models/Task.js)
// ============================================================================
// Why this file exists:
// This file defines the exact shape of a "Task" document in our MongoDB database.
// A task is the smallest unit of work in our Smart Study Planner — it represents 
// one specific thing the student needs to do (e.g., "Finish Chapter 5 notes").
//
// WHAT IS SCHEMA VALIDATION?
// ===========================
// Without schema validation, MongoDB would accept any random data you throw at it.
// By defining this schema, Mongoose actively *validates* every single task before 
// saving it. If a task is missing a title, or uses the wrong priority, Mongoose 
// automatically rejects the save and throws a validation error! This keeps our 
// database perfectly clean.

const mongoose = require('mongoose');

// ============================================================================
// TASK SCHEMA (The Blueprint)
// ============================================================================
const taskSchema = new mongoose.Schema(
  {
    // ========================================================================
    // FIELD 1: user (userId)
    // ========================================================================
    // EXPLAINING OBJECTID REFERENCES:
    // This creates a one-to-many relationship: One User has Many Tasks.
    // We store the unique 'ObjectId' of the user who owns this task.
    // By doing this, we guarantee that User A can NEVER see User B's tasks.
    // 'ref: User' tells Mongoose which collection to look in if we ever need 
    // to fetch the user's actual profile data along with the task.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A task must belong to a user'],
    },

    // ========================================================================
    // FIELD 2: subject (subjectId)
    // ========================================================================
    // This is a SECOND ObjectId reference! It links this task to a specific Subject.
    // This allows us to say: "Find all tasks that belong to User A AND are for Calculus."
    // 'required: false' means a task can exist generically (e.g., "Buy notebook") 
    // without needing to be tied to a specific academic subject.
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: false, 
    },

    // ========================================================================
    // FIELD 3: title
    // ========================================================================
    // Why it exists: A short, clear description of what needs to be done.
    // - type: String ensures it is text.
    // - required: true triggers Schema Validation to block blank tasks.
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
    },

    // ========================================================================
    // FIELD 4: description
    // ========================================================================
    // Why it exists: An optional longer note with extra detail or instructions.
    // Since required is not true, it defaults to an empty string.
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // ========================================================================
    // FIELD 5: dueDate
    // ========================================================================
    // Why it exists: The deadline for this specific task.
    // - type: Date triggers Schema Validation to ensure the input is an actual 
    //   valid calendar date, preventing bad data like { dueDate: "tomorrow" }.
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date for the task'],
    },

    // ========================================================================
    // FIELD 6: priority
    // ========================================================================
    // Why it exists: Determines the urgency of the task.
    // We use the 'enum' property to strictly limit the allowed values.
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium, or High',
      },
      default: 'Medium',
    },

    // ========================================================================
    // FIELD 6.5: status
    // ========================================================================
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed', 'Overdue'],
        message: 'Status must be Pending, In Progress, Completed, or Overdue',
      },
      default: 'Pending',
    },

    // ========================================================================
    // FIELD 7: isCompleted (Task Status)
    // ========================================================================
    // EXPLAINING TASK STATUS:
    // This Boolean field acts as the "Status" of our task (Pending vs Completed).
    // - false (Default) → Status is PENDING (still needs to be done)
    // - true → Status is COMPLETED (done!)
    // This one simple field powers our "Mark Completed", "View Pending", and 
    // "View Completed" filters on the frontend.
    isCompleted: {
      type: Boolean,
      default: false, 
    },

    // ========================================================================
    // FIELD 8: completedAt
    // ========================================================================
    // Why it exists: Records the exact timestamp when the user hit "Complete Task".
    // This powers our Progress charts (e.g., "Tasks completed this week").
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // ========================================================================
    // OPTION: timestamps (createdAt & updatedAt)
    // ========================================================================
    // EXPLAINING TIMESTAMPS:
    // By enabling this, Mongoose automatically injects 'createdAt' (when the 
    // task was created) and 'updatedAt' (when it was last edited or completed).
    timestamps: true,
  }
);

// ============================================================================
// EXPORTING THE MODEL
// ============================================================================
// We compile the schema blueprint into a real Model called "Task".
// Mongoose will create a collection named "tasks" in MongoDB.
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
