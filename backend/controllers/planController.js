// ============================================================================
// STUDY PLAN GENERATOR CONTROLLER (planController.js)
// ============================================================================
// Why this file exists:
// This is the "smart" engine of the Smart Study Planner. It takes the user's 
// subjects, priorities, exam dates, and available hours and uses a set of 
// logical rules to generate a personalized daily study timetable.
//
// NO AI IS USED — instead, we use a rule-based algorithm built entirely from 
// pure mathematics and logical comparisons that anyone can understand and follow.
//
// ============================================================================
// THE ALGORITHM — HOW IT WORKS (Overview)
// ============================================================================
// The plan generator works in 4 stages:
//
// STAGE 1 — SCORE SUBJECTS
//   Give each subject a numeric "urgency score" based on two factors:
//   a. How close is the exam? (closer = more urgent)
//   b. What is the priority? (High > Normal > Low)
//
// STAGE 2 — RANK SUBJECTS
//   Sort all subjects from HIGHEST score to LOWEST score.
//
// STAGE 3 — SPLIT HOURS INTO SESSIONS
//   Divide the user's total available daily hours into 3 time blocks.
//
// STAGE 4 — ASSIGN & SAVE (MongoDB Connection)
//   Slot subjects into sessions, then SAVE the final plan to our StudyPlan collection!

// Import the StudyPlan model so we can connect this API to MongoDB
const StudyPlan = require('../models/StudyPlan');

// ============================================================================
// HELPER FUNCTION 1: getDaysUntilExam
// ============================================================================
// Why this function exists:
// Calculates how many days remain between TODAY and the exam date.
// This is the foundation of urgency — the fewer days remaining, the more 
// hours should be dedicated to that subject.
//
// How it works:
// JavaScript Date math returns milliseconds. We convert to days using:
// 1 day = 24 hours × 60 minutes × 60 seconds × 1000 milliseconds = 86,400,000 ms
const getDaysUntilExam = (examDate) => {
  const today = new Date();

  // Set the time to midnight so we compare whole DAYS, not hours/minutes
  today.setHours(0, 0, 0, 0);

  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);

  // Calculate the difference in milliseconds, then convert to days
  const diffMs = exam - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Return at least 1 so we never divide by zero in the score calculation
  return Math.max(1, diffDays);
};

// ============================================================================
// HELPER FUNCTION 2: getPriorityScore
// ============================================================================
// Why this function exists:
// Converts a text priority ('High', 'Normal', 'Low') into a numeric value.
// We need a number because we'll use it in math calculations for the urgency score.
// Higher priority = higher number = more study time.
const getPriorityScore = (priority) => {
  // A "lookup object" is an efficient way to map values — much cleaner than if/else
  const scores = {
    High: 3,
    Normal: 2,
    Low: 1,
  };
  // Return the score, or default to 2 (Normal) if an unknown value is passed
  return scores[priority] || 2;
};

// ============================================================================
// HELPER FUNCTION 3: getDifficultyMultiplier
// ============================================================================
// Why this function exists:
// Converts difficulty level into a decimal multiplier.
// A Hard subject should get MORE study hours than an Easy one.
// We multiply the base study hours by this value to get the adjusted hours.
const getDifficultyMultiplier = (difficulty) => {
  const multipliers = {
    Hard: 1.5,   // Add 50% more time for hard subjects
    Medium: 1.0, // No change for medium subjects
    Easy: 0.75,  // Reduce time slightly for easy subjects
  };
  return multipliers[difficulty] || 1.0;
};

// ============================================================================
// HELPER FUNCTION 4: calculateUrgencyScore
// ============================================================================
// Why this function exists:
// This is the CORE of our algorithm. It calculates a single "urgency score" 
// for each subject. This number determines how HIGH UP in the timetable 
// a subject's study session will be placed.
//
// THE FORMULA EXPLAINED:
// ========================
//   urgencyScore = (priorityScore × difficultyMultiplier × 100) / daysUntilExam
//
// Breaking this down:
// - priorityScore (1-3): Higher priority = bigger numerator = higher score.
// - difficultyMultiplier (0.75-1.5): Harder subjects = bigger numerator = higher score.
// - 100: A scaling factor to make the numbers more readable (e.g., 150 vs 1.5).
// - daysUntilExam: This is the DIVISOR. The FEWER days remaining, the LARGER 
//   the score becomes. An exam in 2 days scores MUCH higher than one in 30 days.
//
// EXAMPLE:
//   Calculus: Priority=High(3), Difficulty=Hard(1.5), Exam in 5 days
//   Score = (3 × 1.5 × 100) / 5 = 450 / 5 = 90
//
//   English: Priority=Low(1), Difficulty=Easy(0.75), Exam in 20 days
//   Score = (1 × 0.75 × 100) / 20 = 75 / 20 = 3.75
//
//   Result: Calculus (90) is ranked WAY above English (3.75) ✓ Makes sense!
const calculateUrgencyScore = (subject) => {
  const days = getDaysUntilExam(subject.examDate);
  const priority = getPriorityScore(subject.priority);
  const difficulty = getDifficultyMultiplier(subject.difficulty);

  // Apply the formula
  return (priority * difficulty * 100) / days;
};

// ============================================================================
// HELPER FUNCTION 5: splitIntoSessions
// ============================================================================
// Why this function exists:
// Divides the user's total daily hours into the 3 session blocks.
// Research shows the brain has different focus levels at different times of day:
// - Morning: ~50% of daily hours (peak focus — for hardest subjects)
// - Afternoon: ~30% of daily hours (medium focus — for medium tasks)
// - Evening: ~20% of daily hours (lower focus — for light review)
//
// Math.floor() is used to round DOWN to a clean hour value so we never over-schedule.
const splitIntoSessions = (totalHours) => {
  return {
    morning: Math.max(0.5, Math.floor(totalHours * 0.5 * 2) / 2),   // 50% of total, rounded to 0.5
    afternoon: Math.max(0.5, Math.floor(totalHours * 0.3 * 2) / 2), // 30% of total
    evening: Math.max(0.5, Math.floor(totalHours * 0.2 * 2) / 2),   // 20% of total
  };
};

// ============================================================================
// HELPER FUNCTION 6: buildSession
// ============================================================================
// Why this function exists:
// Takes a block of available hours and a list of ranked subjects, and assigns 
// subjects into that session until the hours run out.
// This "greedy" approach fills the most urgent subjects into each slot first.
//
// Parameters:
// - sessionName: e.g., "Morning Session"
// - startTime: e.g., "8:00 AM"
// - availableHours: e.g., 3 (hours available in this session)
// - subjectQueue: the sorted array of subjects, consumed from the front
// - adjustedHoursMap: a map of subjectId → adjusted study hours for that subject
const buildSession = (sessionName, startTime, availableHours, subjectQueue, adjustedHoursMap) => {
  const slots = [];
  let remainingHours = availableHours;

  // Loop through subjects in order (most urgent first) and fill the session
  while (subjectQueue.length > 0 && remainingHours >= 0.5) {
    // Look at the FIRST subject in the queue (most urgent remaining)
    const subject = subjectQueue[0];

    // How many hours does this subject need today?
    const needed = adjustedHoursMap[subject._id || subject.name] || subject.dailyStudyHours;

    // Calculate how much time we can actually give this subject in this session
    // We can't give more than what's available OR more than what's needed
    const allocated = Math.min(needed, remainingHours);

    // Record this slot in our session plan
    slots.push({
      subjectName: subject.name,
      priority: subject.priority,
      difficulty: subject.difficulty,
      daysUntilExam: getDaysUntilExam(subject.examDate),
      hoursAllocated: allocated,
    });

    remainingHours -= allocated;

    // If we've fully satisfied this subject's needs, remove it from the queue
    // Otherwise, keep it in the queue for the next session to continue allocating hours
    if (allocated >= needed) {
      subjectQueue.shift(); // Remove the first element from the array
    } else {
      // Partially allocated — update how many hours are still needed
      adjustedHoursMap[subject._id || subject.name] = needed - allocated;
      break; // Session is now full
    }
  }

  return {
    session: sessionName,
    startTime,
    totalHours: availableHours,
    subjects: slots,
  };
};

// ============================================================================
// MAIN CONTROLLER: generateStudyPlan
// ============================================================================
// Why this function exists:
// This is the single API endpoint the React frontend calls to get a full 
// generated timetable. It orchestrates all the helper functions above to 
// produce a structured, ranked, session-based daily study plan.
//
// Expected request body from React:
// {
//   "subjects": [
//     { "name": "Calculus", "priority": "High", "difficulty": "Hard", "examDate": "2026-08-10", "dailyStudyHours": 2 },
//     { "name": "English", "priority": "Low", "difficulty": "Easy", "examDate": "2026-09-01", "dailyStudyHours": 1 }
//   ],
//   "availableDailyHours": 8
// }
const generateStudyPlan = async (req, res) => {
  const { subjects, availableDailyHours } = req.body;

  // -------------------------------------------------------------------------
  // STEP 1: Input Validation
  // -------------------------------------------------------------------------
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: 'Please provide at least one subject.' });
  }

  if (!availableDailyHours || availableDailyHours < 1) {
    return res.status(400).json({ message: 'Please provide your available daily study hours (minimum 1).' });
  }

  // -------------------------------------------------------------------------
  // STAGE 1 & 2: SCORE AND RANK SUBJECTS (Sort by urgency, highest first)
  // -------------------------------------------------------------------------
  // We calculate a score for each subject and sort descending (highest = most urgent)
  const rankedSubjects = [...subjects].sort((a, b) => {
    return calculateUrgencyScore(b) - calculateUrgencyScore(a);
  });

  // -------------------------------------------------------------------------
  // Build a map of subject → adjusted daily hours (accounting for difficulty)
  // e.g., A 'Hard' subject that requests 2 hrs/day actually gets 2 × 1.5 = 3 hrs
  // -------------------------------------------------------------------------
  const adjustedHoursMap = {};
  rankedSubjects.forEach((subject) => {
    const multiplier = getDifficultyMultiplier(subject.difficulty);
    const rawHours = subject.dailyStudyHours;
    const adjusted = Math.min(rawHours * multiplier, availableDailyHours);
    adjustedHoursMap[subject._id || subject.name] = parseFloat(adjusted.toFixed(1));
  });

  // -------------------------------------------------------------------------
  // STAGE 3: SPLIT DAILY HOURS INTO MORNING / AFTERNOON / EVENING
  // -------------------------------------------------------------------------
  const sessions = splitIntoSessions(availableDailyHours);

  // We pass a COPY of the ranked subjects array so the original isn't mutated
  // Each buildSession call will consume from this shared queue
  const subjectQueue = [...rankedSubjects];
  const hoursMapCopy = { ...adjustedHoursMap };

  // -------------------------------------------------------------------------
  // STAGE 4: ASSIGN SUBJECTS TO EACH SESSION
  // -------------------------------------------------------------------------
  const morningSession = buildSession(
    'Morning Session',
    '8:00 AM - 12:00 PM',
    sessions.morning,
    subjectQueue,
    hoursMapCopy
  );

  const afternoonSession = buildSession(
    'Afternoon Session',
    '1:00 PM - 5:00 PM',
    sessions.afternoon,
    subjectQueue,
    hoursMapCopy
  );

  const eveningSession = buildSession(
    'Evening Session',
    '7:00 PM - 9:00 PM',
    sessions.evening,
    subjectQueue,
    hoursMapCopy
  );

  // -------------------------------------------------------------------------
  // BUILD THE FINAL RESPONSE OBJECT
  // -------------------------------------------------------------------------
  const planData = {
    generatedAt: new Date().toISOString(),
    totalDailyHours: availableDailyHours,
    subjectCount: subjects.length,

    // The ranked list shows the user WHY subjects are ordered this way
    subjectRanking: rankedSubjects.map((s, index) => ({
      rank: index + 1,
      name: s.name,
      urgencyScore: parseFloat(calculateUrgencyScore(s).toFixed(2)),
      daysUntilExam: getDaysUntilExam(s.examDate),
      priority: s.priority,
      difficulty: s.difficulty,
    })),

    // The three session blocks with assigned subject slots
    timetable: [morningSession, afternoonSession, eveningSession],

    // A helpful tip for the student based on the most urgent subject
    tip: `Focus on ${rankedSubjects[0].name} first — it has the highest urgency score!`,
  };

  try {
    // =========================================================================
    // CONNECTING TO MONGODB: SAVE THE STUDY PLAN
    // =========================================================================
    // Here we use our StudyPlan model to actually SAVE the generated data 
    // into the MongoDB database so it isn't lost when the user closes the app!
    // We attach 'user: req.user._id' to prove this logged-in user owns this plan.
    const savedPlan = await StudyPlan.create({
      user: req.user._id, // Set by our auth middleware
      date: new Date(),
      totalHours: availableDailyHours,
      morningSession: morningSession.subjects, // Save the array of subjects
      afternoonSession: afternoonSession.subjects,
      eveningSession: eveningSession.subjects,
    });

    // Send the generated plan (along with its new MongoDB _id) back to React
    res.status(200).json({ planData, savedPlanId: savedPlan._id });
  } catch (dbError) {
    console.error("Database error while saving study plan:", dbError);
    // Even if saving fails, we can still send the planData to the user so the app works
    res.status(200).json({ planData, error: "Plan generated but could not be saved to DB" });
  }
};

module.exports = { generateStudyPlan };
