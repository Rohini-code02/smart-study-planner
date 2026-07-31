// ============================================================================
// PROGRESS TRACKING CONTROLLER (progressController.js)
// ============================================================================
// Why this file exists:
// This file calculates and returns all the statistics needed to power the
// Progress Dashboard in our React frontend.
//
// Instead of sending raw data to React and making the frontend do all the math,
// we calculate everything HERE on the server. This is better because:
// 1. The server is faster at querying and aggregating data than the browser.
// 2. It keeps our React components simple — they just display numbers, not calculate them.
// 3. If the math logic changes, we update it in ONE place (here), not in every component.
//
// This controller queries TWO collections: Tasks and Subjects.

const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Progress = require('../models/Progress'); // Added to connect to the Progress model

// ============================================================================
// HELPER FUNCTION 1: getStartOfWeek
// ============================================================================
// Why this function exists:
// Several statistics are calculated for "This Week" (e.g., weekly progress).
// We need to know when the current week STARTED (Monday at 00:00:00).
// This function returns that exact midnight timestamp so we can use it 
// in MongoDB queries to filter only documents created/updated this week.
//
// HOW IT WORKS:
// JavaScript's getDay() returns: 0=Sunday, 1=Monday, ..., 6=Saturday
// We calculate how many days ago Monday was and subtract that from today.
const getStartOfWeek = () => {
  const now = new Date();

  // getDay() returns 0 (Sun) to 6 (Sat). We want days since MONDAY.
  // The formula (day + 6) % 7 converts: Mon=0, Tue=1, ..., Sun=6
  const dayOfWeek = now.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  // Create a new Date for the start of this week (Monday at midnight)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceMonday);

  // Set the time to the very start of that day: 00 hours, 00 min, 00 sec, 0 ms
  startOfWeek.setHours(0, 0, 0, 0);

  return startOfWeek;
};

// ============================================================================
// HELPER FUNCTION 2: calculateCompletionPercentage
// ============================================================================
// Why this function exists:
// Converts raw task counts into a clean percentage for the progress bar 
// and "Goal Completion %" card in the React Progress Dashboard.
//
// HOW IT WORKS:
// Simple math: (completedCount / totalCount) * 100
// We use Math.round() to get a clean whole number (e.g., 84, not 84.2857...)
// We guard against division by zero: if total is 0, we return 0 instead of NaN.
const calculateCompletionPercentage = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// ============================================================================
// CONTROLLER 1: getDashboardStats
// ============================================================================
// Why this controller exists:
// This is the PRIMARY endpoint for the React Progress Dashboard.
// It runs MULTIPLE database queries at the same time (using Promise.all for speed)
// and returns a single, clean summary object with every stat the dashboard needs.
//
// WHY Promise.all?
// If we ran each database query one after another (sequentially), we'd wait for
// each to finish before starting the next. With Promise.all, ALL queries run 
// SIMULTANEOUSLY in parallel — dramatically faster!
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id; // The logged-in user's ID from the JWT middleware
    const weekStart = getStartOfWeek(); // Monday midnight of the current week

    // =========================================================================
    // RUN ALL DATABASE QUERIES IN PARALLEL (for maximum speed)
    // =========================================================================
    // Each of these is a MongoDB query. We start them all at the same time.
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      tasksCompletedThisWeek,
      allSubjects,
      subjectsWithUpcomingExams,
    ] = await Promise.all([

      // QUERY 1: Count the TOTAL number of tasks this user has ever created
      // .countDocuments() is much faster than .find() because it only counts, not retrieves
      Task.countDocuments({ user: userId }),

      // QUERY 2: Count how many tasks are COMPLETED (isCompleted = true)
      Task.countDocuments({ user: userId, isCompleted: true }),

      // QUERY 3: Count how many tasks are still PENDING (isCompleted = false)
      Task.countDocuments({ user: userId, isCompleted: false }),

      // QUERY 4: Count tasks completed THIS WEEK
      // completedAt is the timestamp we saved when the user ticked "Mark Complete"
      // $gte means "Greater Than or Equal To" — a MongoDB comparison operator
      Task.countDocuments({
        user: userId,
        isCompleted: true,
        completedAt: { $gte: weekStart }, // Only count tasks completed since Monday
      }),

      // QUERY 5: Fetch ALL subjects to calculate study hours
      Subject.find({ user: userId }),

      // QUERY 6: Fetch subjects with exams coming in the next 14 days
      Subject.find({
        user: userId,
        examDate: {
          $gte: new Date(), // Exam is in the future (from right now)
          $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Within 14 days
          // 14 * 24 * 60 * 60 * 1000 converts 14 days to milliseconds
        },
      }).sort({ examDate: 1 }), // Sort by the nearest exam first
    ]);

    // =========================================================================
    // CALCULATE: Total Planned Study Hours
    // =========================================================================
    // Why this calculation exists:
    // We sum up the 'dailyStudyHours' field across ALL subjects to find out 
    // how many hours per day the user has committed to studying in total.
    // 'reduce' is a JavaScript array method that accumulates a running total.
    //
    // HOW reduce WORKS:
    // It loops through every subject and adds its dailyStudyHours to a running total.
    // - 'total' starts at 0 (the second argument of reduce)
    // - Each loop: total = total + subject.dailyStudyHours
    const totalDailyStudyHours = allSubjects.reduce((total, subject) => {
      return total + (subject.dailyStudyHours || 0);
    }, 0); // Start the running total at 0

    // =========================================================================
    // CALCULATE: Estimated Weekly Study Hours
    // =========================================================================
    // Why this calculation exists:
    // Multiplying the daily hours by 7 gives an approximation of the full 
    // weekly study commitment. This is displayed on the "Weekly Progress" card.
    const weeklyStudyHours = parseFloat((totalDailyStudyHours * 7).toFixed(1));

    // =========================================================================
    // CALCULATE: Task Completion Percentage
    // =========================================================================
    // Uses our helper function to get a clean percentage number
    const completionPercentage = calculateCompletionPercentage(completedTasks, totalTasks);

    // =========================================================================
    // CALCULATE: Weekly Progress Percentage
    // =========================================================================
    // Why this calculation exists:
    // Compares tasks completed THIS WEEK against a "target" of completing 
    // at least 5 tasks per week (a reasonable productivity goal).
    // We cap it at 100% so the bar doesn't overflow past 100.
    const weeklyTarget = 5; // Target: complete 5 tasks per week
    const weeklyProgressPercentage = Math.min(
      100,
      calculateCompletionPercentage(tasksCompletedThisWeek, weeklyTarget)
    );

    // =========================================================================
    // CALCULATE: Subject Difficulty Breakdown
    // =========================================================================
    // Why this calculation exists:
    // Counts how many subjects fall into each difficulty level.
    // This powers a visual breakdown chart on the Progress Dashboard.
    //
    // HOW filter + length WORKS:
    // .filter() creates a new array with only the subjects that match the condition.
    // .length then counts how many items are in that filtered array.
    const difficultyBreakdown = {
      hard: allSubjects.filter((s) => s.difficulty === 'Hard').length,
      medium: allSubjects.filter((s) => s.difficulty === 'Medium').length,
      easy: allSubjects.filter((s) => s.difficulty === 'Easy').length,
    };

    // =========================================================================
    // CONNECT TO MONGODB: SAVE PROGRESS RECORD
    // =========================================================================
    // Now that we've calculated all these amazing stats, we use 'findOneAndUpdate'
    // to save a cached summary into our Progress collection!
    // { upsert: true } means: "If this user doesn't have a Progress document yet, CREATE one."
    await Progress.findOneAndUpdate(
      { user: userId },
      {
        completedTasks: completedTasks,
        pendingTasks: pendingTasks,
        totalStudyHours: parseFloat(totalDailyStudyHours.toFixed(1)),
        progressPercentage: completionPercentage
      },
      { upsert: true, new: true }
    );

    // =========================================================================
    // ASSEMBLE AND SEND THE FINAL RESPONSE
    // =========================================================================
    res.status(200).json({

      // --- TASK STATISTICS ---
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completedThisWeek: tasksCompletedThisWeek,
        completionPercentage, // e.g., 84 (means 84%)
      },

      // --- STUDY HOURS ---
      studyHours: {
        dailyCommitment: parseFloat(totalDailyStudyHours.toFixed(1)),
        weeklyEstimate: weeklyStudyHours,
      },

      // --- WEEKLY PROGRESS ---
      weeklyProgress: {
        tasksCompletedThisWeek,
        weeklyTarget,
        weeklyProgressPercentage, // e.g., 60 (means 60% of weekly target done)
        weekStartDate: weekStart.toISOString().split('T')[0], // e.g., "2026-07-28"
      },

      // --- SUBJECT STATISTICS ---
      subjects: {
        total: allSubjects.length,
        difficultyBreakdown,
        upcomingExams: subjectsWithUpcomingExams.map((s) => ({
          name: s.name,
          examDate: s.examDate,
          daysLeft: Math.ceil(
            (new Date(s.examDate) - new Date()) / (1000 * 60 * 60 * 24)
          ),
          priority: s.priority,
        })),
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while calculating progress stats' });
  }
};

// ============================================================================
// CONTROLLER 2: getWeeklyBreakdown
// ============================================================================
// Why this controller exists:
// Powers the Bar Chart on the Progress Dashboard — showing how many tasks 
// were completed on EACH DAY of the current week (Mon, Tue, Wed...).
// This gives a visual heatmap of the user's daily productivity.
const getWeeklyBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    const weekStart = getStartOfWeek();

    // Fetch all tasks completed this week (with their completedAt timestamp)
    const completedThisWeek = await Task.find({
      user: userId,
      isCompleted: true,
      completedAt: { $gte: weekStart },
    }).select('completedAt title'); // We only need the date and title — not the whole document

    // -----------------------------------------------------------------------
    // BUILD A DAY-BY-DAY BREAKDOWN
    // -----------------------------------------------------------------------
    // Why this logic exists:
    // We need to bucket each completed task into its correct day of the week.
    // We create an object with 7 keys (Mon to Sun), each starting at 0.
    // Then for each task, we find which day it was completed and increment that count.
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const breakdown = {};
    dayNames.forEach((day) => (breakdown[day] = 0)); // Initialize all days to 0

    completedThisWeek.forEach((task) => {
      const completedDate = new Date(task.completedAt);

      // getDay() returns 0=Sun, 1=Mon..6=Sat. We convert to Mon=0..Sun=6
      const dayIndex = (completedDate.getDay() + 6) % 7;
      const dayName = dayNames[dayIndex];

      // Increment the count for that specific day
      breakdown[dayName] += 1;
    });

    // Format the response as an array (easier for React to map over for charts)
    const chartData = dayNames.map((day) => ({
      day,
      tasksCompleted: breakdown[day],
    }));

    res.status(200).json({
      weekStartDate: weekStart.toISOString().split('T')[0],
      totalCompletedThisWeek: completedThisWeek.length,
      dailyBreakdown: chartData,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while calculating weekly breakdown' });
  }
};

module.exports = { getDashboardStats, getWeeklyBreakdown };
