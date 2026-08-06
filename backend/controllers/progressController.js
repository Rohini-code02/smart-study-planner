const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Progress = require('../models/Progress');
const Exam = require('../models/Exam');
const StudyPlan = require('../models/StudyPlan');

const getStartOfWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

const calculateCompletionPercentage = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const weekStart = getStartOfWeek();

    // Query all in parallel
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      tasksCompletedThisWeek,
      allSubjects,
      upcomingExams,
      latestStudyPlan,
    ] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, isCompleted: true }),
      Task.countDocuments({ user: userId, isCompleted: false }),
      Task.countDocuments({
        user: userId,
        isCompleted: true,
        completedAt: { $gte: weekStart },
      }),
      Subject.find({ user: userId }),
      // Query Exams collection instead of Subject for upcoming exams
      Exam.find({
        user: userId,
        date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      }).sort({ date: 1 }).populate('subject'),
      // Query StudyPlan for total study hours
      StudyPlan.findOne({ user: userId }).sort({ createdAt: -1 }),
    ]);

    // Use totalHours from the latest generated StudyPlan, or default to 0
    const totalDailyStudyHours = latestStudyPlan ? latestStudyPlan.totalHours : 0;
    const weeklyStudyHours = parseFloat((totalDailyStudyHours * 7).toFixed(1));

    const completionPercentage = calculateCompletionPercentage(completedTasks, totalTasks);

    const weeklyTarget = 5;
    const weeklyProgressPercentage = Math.min(
      100,
      calculateCompletionPercentage(tasksCompletedThisWeek, weeklyTarget)
    );

    const difficultyBreakdown = {
      hard: allSubjects.filter((s) => s.difficulty === 'Hard').length,
      medium: allSubjects.filter((s) => s.difficulty === 'Medium').length,
      easy: allSubjects.filter((s) => s.difficulty === 'Easy').length,
    };

    // Calculate Streaks
    // Get current progress doc before update to read lastActiveDate
    let currentProgress = await Progress.findOne({ user: userId });
    let currentStreak = currentProgress ? currentProgress.currentStreak || 0 : 0;
    let longestStreak = currentProgress ? currentProgress.longestStreak || 0 : 0;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (currentProgress && currentProgress.lastActiveDate) {
      const lastActive = new Date(currentProgress.lastActiveDate);
      lastActive.setHours(0,0,0,0);

      // If they were last active yesterday, streak continues (if they are active today, it increments)
      // If they were last active before yesterday, streak is broken.
      if (lastActive < yesterday) {
        currentStreak = 0; // Streak broken
      }
    }

    // We consider them "active" if they have completed tasks this week (or today) - for simplicity we'll just check if they completed tasks today
    const tasksCompletedToday = await Task.countDocuments({
      user: userId,
      isCompleted: true,
      completedAt: { $gte: today },
    });

    let newLastActiveDate = currentProgress ? currentProgress.lastActiveDate : null;
    
    if (tasksCompletedToday > 0) {
      if (!currentProgress || !currentProgress.lastActiveDate) {
        currentStreak = 1;
      } else {
        const lastActive = new Date(currentProgress.lastActiveDate);
        lastActive.setHours(0,0,0,0);
        if (lastActive.getTime() === yesterday.getTime()) {
           currentStreak += 1;
        } else if (lastActive.getTime() < yesterday.getTime()) {
           currentStreak = 1;
        }
        // If lastActive is today, streak stays the same
      }
      newLastActiveDate = new Date();
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }

    const progressDoc = await Progress.findOneAndUpdate(
      { user: userId },
      {
        completedTasks: completedTasks,
        pendingTasks: pendingTasks,
        totalStudyHours: parseFloat(totalDailyStudyHours.toFixed(1)),
        progressPercentage: completionPercentage,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        lastActiveDate: newLastActiveDate
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completedThisWeek: tasksCompletedThisWeek,
        completionPercentage,
      },
      studyHours: {
        dailyCommitment: parseFloat(totalDailyStudyHours.toFixed(1)),
        weeklyEstimate: weeklyStudyHours,
        actual: progressDoc ? progressDoc.actualStudyHours : 0,
      },
      weeklyProgress: {
        tasksCompletedThisWeek,
        weeklyTarget,
        weeklyProgressPercentage,
        weekStartDate: weekStart.toISOString().split('T')[0],
      },
      streaks: {
        current: currentStreak,
        longest: longestStreak
      },
      subjects: {
        total: allSubjects.length,
        difficultyBreakdown,
        upcomingExams: upcomingExams.map((e) => ({
          name: e.title,
          examDate: e.date,
          daysLeft: Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24)),
          subjectName: e.subject ? e.subject.name : 'General',
        })),
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while calculating progress stats' });
  }
};

const getWeeklyBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    const weekStart = getStartOfWeek();

    const completedThisWeek = await Task.find({
      user: userId,
      isCompleted: true,
      completedAt: { $gte: weekStart },
    }).select('completedAt title');

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const breakdown = {};
    dayNames.forEach((day) => (breakdown[day] = 0));

    completedThisWeek.forEach((task) => {
      const completedDate = new Date(task.completedAt);
      const dayIndex = (completedDate.getDay() + 6) % 7;
      const dayName = dayNames[dayIndex];
      breakdown[dayName] += 1;
    });

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

const logPomodoroSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { duration } = req.body; // duration in minutes

    if (!duration || typeof duration !== 'number') {
      return res.status(400).json({ message: 'Valid duration in minutes is required' });
    }

    const durationInHours = duration / 60;

    const updatedProgress = await Progress.findOneAndUpdate(
      { user: userId },
      { $inc: { actualStudyHours: durationInHours } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: 'Pomodoro session logged successfully',
      actualStudyHours: updatedProgress.actualStudyHours
    });
  } catch (error) {
    console.error('Error logging pomodoro session:', error);
    res.status(500).json({ message: 'Server error while logging session' });
  }
};

module.exports = { getDashboardStats, getWeeklyBreakdown, logPomodoroSession };
