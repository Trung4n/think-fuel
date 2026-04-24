import { asyncHandler } from "../utils/asyncHandler.js";
import StudentStat from "../models/student_stats.model.js";
import User from "../models/users.model.js";
import QuizAttempt from "../models/quiz_attempts.model.js";

export const getLeaderboard = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student", status: "active" })
    .select("_id fullName")
    .lean();

  if (students.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const studentIds = students.map((s) => s._id);

  const [stats, accuracyData] = await Promise.all([
    StudentStat.find({ userId: { $in: studentIds } }).lean(),
    QuizAttempt.aggregate([
      { $match: { userId: { $in: studentIds } } },
      {
        $group: {
          _id: "$userId",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
    ]),
  ]);

  const statsMap = Object.fromEntries(
    stats.map((s) => [s.userId.toString(), s]),
  );
  const accuracyMap = Object.fromEntries(
    accuracyData.map((a) => [a._id.toString(), a]),
  );

  const ranked = students
    .map((student) => {
      const id = student._id.toString();
      const stat = statsMap[id] || {};
      const acc = accuracyMap[id] || { total: 0, correct: 0 };

      const quizAccuracy = acc.total > 0 ? (acc.correct / acc.total) * 100 : 0;
      const independenceScore = stat.independenceScore ?? 0;
      const streakNorm = (Math.min(stat.correctStreak ?? 0, 20) / 20) * 100;
      const volumeNorm = (Math.min(stat.quizCompleted ?? 0, 50) / 50) * 100;

      const score =
        quizAccuracy * 0.4 +
        independenceScore * 0.3 +
        streakNorm * 0.15 +
        volumeNorm * 0.15;

      return {
        userId: id,
        name: student.fullName,
        score: Math.round(score * 10) / 10,
        quizAccuracy: Math.round(quizAccuracy),
        independenceScore: Math.round(independenceScore),
        correctStreak: stat.correctStreak ?? 0,
        quizCompleted: stat.quizCompleted ?? 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  ranked.forEach((s, i) => {
    s.rank = i + 1;
  });

  res.json({ success: true, data: ranked });
});
