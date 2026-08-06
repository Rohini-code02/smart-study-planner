// ============================================================================
// STUDY PLAN GENERATOR CONTROLLER (planController.js)
// ============================================================================
const StudyPlan = require('../models/StudyPlan');
const Task = require('../models/Task');
const mongoose = require('mongoose');

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
      _id: new mongoose.Types.ObjectId(), // Inject unique ID for the slot
      subjectId: subject._id || null,
      subjectName: subject.name,
      priority: subject.priority,
      difficulty: subject.difficulty,
      daysUntilExam: getDaysUntilExam(subject.examDate),
      hoursAllocated: allocated,
      isCompleted: false, // Track completion
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
  const userId = req.user._id;

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
      user: userId,
      date: new Date(),
      totalHours: availableDailyHours,
      morningSession: morningSession.subjects,
      afternoonSession: afternoonSession.subjects,
      eveningSession: eveningSession.subjects,
    });

    // Extract all slots to create Tasks
    const allSlots = [
      ...morningSession.subjects,
      ...afternoonSession.subjects,
      ...eveningSession.subjects
    ];

    const today = new Date();
    const tasksToCreate = allSlots.map(slot => ({
      user: userId,
      subject: slot.subjectId,
      title: `Study Session: ${slot.subjectName} (${slot.hoursAllocated} hrs)`,
      description: `Auto-generated study session from AI Study Planner.`,
      dueDate: today,
      priority: slot.priority === 'High' ? 'High' : slot.priority === 'Low' ? 'Low' : 'Medium',
      status: 'Pending',
      isCompleted: false
    }));

    if (tasksToCreate.length > 0) {
      await Task.insertMany(tasksToCreate);
    }

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

const updateCustomPlan = async (req, res) => {
  try {
    const { timetable } = req.body;
    
    if (!timetable || !Array.isArray(timetable)) {
      return res.status(400).json({ message: 'Invalid custom timetable data provided.' });
    }

    // Find the user's latest plan
    const plan = await StudyPlan.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!plan) {
      return res.status(404).json({ message: 'No saved plan found to update. Generate a plan first.' });
    }

    // Extract sessions from the provided timetable array
    const morningSession = timetable.find(s => s.session === 'Morning Session')?.subjects || [];
    const afternoonSession = timetable.find(s => s.session === 'Afternoon Session')?.subjects || [];
    const eveningSession = timetable.find(s => s.session === 'Evening Session')?.subjects || [];

    // Update the DB plan
    plan.morningSession = morningSession;
    plan.afternoonSession = afternoonSession;
    plan.eveningSession = eveningSession;
    await plan.save();

    res.status(200).json({ message: 'Custom study plan saved successfully!' });
  } catch (error) {
    console.error('Error saving custom plan:', error);
    res.status(500).json({ message: 'Error saving custom study plan' });
  }
};

const toggleSlotStatus = async (req, res) => {
  try {
    const { planId, slotId } = req.params;
    
    const plan = await StudyPlan.findOne({ _id: planId, user: req.user._id });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    let found = false;
    let newStatus = false;

    // Helper to toggle inside an array
    const toggleInArray = (arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i]._id && arr[i]._id.toString() === slotId) {
          arr[i].isCompleted = !arr[i].isCompleted;
          newStatus = arr[i].isCompleted;
          found = true;
          return true;
        }
      }
      return false;
    };

    if (!toggleInArray(plan.morningSession)) {
      if (!toggleInArray(plan.afternoonSession)) {
        toggleInArray(plan.eveningSession);
      }
    }

    if (!found) {
      return res.status(404).json({ message: 'Slot not found in plan' });
    }

    // Mongoose needs to be told the mixed type arrays changed
    plan.markModified('morningSession');
    plan.markModified('afternoonSession');
    plan.markModified('eveningSession');
    
    await plan.save();

    res.status(200).json({ message: 'Slot toggled successfully', isCompleted: newStatus });
  } catch (error) {
    console.error('Error toggling slot:', error);
    res.status(500).json({ message: 'Error toggling slot status' });
  }
};

module.exports = { generateStudyPlan, getLatestPlan, updateCustomPlan, toggleSlotStatus };
