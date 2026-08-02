// ============================================================================
// STUDY PLAN GENERATOR CONTROLLER (planController.js)
// ============================================================================
const StudyPlan = require('../models/StudyPlan');

const getDaysUntilExam = (examDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);

  const diffMs = exam - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

const getPriorityScore = (priority) => {
  const scores = {
    High: 3,
    Normal: 2,
    Low: 1,
  };
  return scores[priority] || 2;
};

const getDifficultyMultiplier = (difficulty) => {
  const multipliers = {
    Hard: 1.5,
    Medium: 1.0,
    Easy: 0.75,
  };
  return multipliers[difficulty] || 1.0;
};

const calculateUrgencyScore = (subject) => {
  const days = getDaysUntilExam(subject.examDate);
  const priority = getPriorityScore(subject.priority);
  const difficulty = getDifficultyMultiplier(subject.difficulty);
  return (priority * difficulty * 100) / days;
};

const splitIntoSessions = (totalHours) => {
  return {
    morning: Math.max(0.5, Math.floor(totalHours * 0.5 * 2) / 2),
    afternoon: Math.max(0.5, Math.floor(totalHours * 0.3 * 2) / 2),
    evening: Math.max(0.5, Math.floor(totalHours * 0.2 * 2) / 2),
  };
};

const buildSession = (sessionName, startTime, availableHours, subjectQueue, adjustedHoursMap) => {
  const slots = [];
  let remainingHours = availableHours;

  while (subjectQueue.length > 0 && remainingHours >= 0.5) {
    const subject = subjectQueue[0];
    const needed = adjustedHoursMap[subject._id || subject.name] || subject.dailyStudyHours || 2;
    const allocated = Math.min(needed, remainingHours);

    slots.push({
      subjectName: subject.name,
      priority: subject.priority,
      difficulty: subject.difficulty,
      daysUntilExam: getDaysUntilExam(subject.examDate),
      hoursAllocated: allocated,
    });

    remainingHours -= allocated;

    if (allocated >= needed) {
      subjectQueue.shift();
    } else {
      adjustedHoursMap[subject._id || subject.name] = needed - allocated;
      break;
    }
  }

  return {
    session: sessionName,
    startTime,
    totalHours: availableHours,
    subjects: slots,
  };
};

const generateStudyPlan = async (req, res) => {
  const { subjects, availableDailyHours } = req.body;

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: 'Please provide at least one subject.' });
  }

  if (!availableDailyHours || availableDailyHours < 1) {
    return res.status(400).json({ message: 'Please provide your available daily study hours (minimum 1).' });
  }

  const rankedSubjects = [...subjects].sort((a, b) => {
    return calculateUrgencyScore(b) - calculateUrgencyScore(a);
  });

  const adjustedHoursMap = {};
  rankedSubjects.forEach((subject) => {
    const multiplier = getDifficultyMultiplier(subject.difficulty);
    const rawHours = subject.dailyStudyHours || 2;
    const adjusted = Math.min(rawHours * multiplier, availableDailyHours);
    adjustedHoursMap[subject._id || subject.name] = parseFloat(adjusted.toFixed(1));
  });

  const sessions = splitIntoSessions(availableDailyHours);
  const subjectQueue = [...rankedSubjects];
  const hoursMapCopy = { ...adjustedHoursMap };

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

  const planData = {
    generatedAt: new Date().toISOString(),
    totalDailyHours: availableDailyHours,
    subjectCount: subjects.length,
    subjectRanking: rankedSubjects.map((s, index) => ({
      rank: index + 1,
      name: s.name,
      urgencyScore: parseFloat(calculateUrgencyScore(s).toFixed(2)),
      daysUntilExam: getDaysUntilExam(s.examDate),
      priority: s.priority,
      difficulty: s.difficulty,
    })),
    timetable: [morningSession, afternoonSession, eveningSession],
    tip: `Focus on ${rankedSubjects[0].name} first — it has the highest urgency score!`,
  };

  try {
    const savedPlan = await StudyPlan.create({
      user: req.user._id,
      date: new Date(),
      totalHours: availableDailyHours,
      morningSession: morningSession.subjects,
      afternoonSession: afternoonSession.subjects,
      eveningSession: eveningSession.subjects,
    });

    res.status(200).json({ planData, savedPlanId: savedPlan._id });
  } catch (dbError) {
    console.error("Database error while saving study plan:", dbError);
    res.status(200).json({ planData, error: "Plan generated but could not be saved to DB" });
  }
};

const getLatestPlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!plan) {
      return res.status(404).json({ message: 'No saved plan found' });
    }
    const planData = {
      generatedAt: plan.createdAt,
      totalDailyHours: plan.totalHours,
      timetable: [
        { session: 'Morning Session', startTime: '8:00 AM - 12:00 PM', totalHours: 0, subjects: plan.morningSession },
        { session: 'Afternoon Session', startTime: '1:00 PM - 5:00 PM', totalHours: 0, subjects: plan.afternoonSession },
        { session: 'Evening Session', startTime: '7:00 PM - 9:00 PM', totalHours: 0, subjects: plan.eveningSession },
      ],
      tip: plan.morningSession && plan.morningSession.length > 0
        ? `Continue focusing on ${plan.morningSession[0].subjectName}!`
        : 'Keep studying consistently!',
    };
    res.status(200).json({ planData, savedPlanId: plan._id });
  } catch (error) {
    console.error('Error fetching latest plan:', error);
    res.status(500).json({ message: 'Error fetching saved plan' });
  }
};

module.exports = { generateStudyPlan, getLatestPlan };
