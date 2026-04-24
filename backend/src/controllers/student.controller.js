import User from "../models/users.model.js";
import StudentStat from "../models/student_stats.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const [stat, user] = await Promise.all([
    StudentStat.findOne({ userId }),
    User.findById(userId).select("fullName"),
  ]);
  res.json({ success: true, data: {
    brainFuel: stat?.brainFuel ?? 1000,
    maxFuel: stat?.maxFuel ?? 1000,
    dependencyScore: stat?.dependencyScore ?? 0,
    independenceScore: stat?.independenceScore ?? 0,
    todayTokenUsed: stat?.todayTokenUsed ?? 0,
    chatCountToday: stat?.chatCountToday ?? 0,
    quizCompleted: stat?.quizCompleted ?? 0,
    correctStreak: stat?.correctStreak ?? 0,
    name: user?.fullName ?? "",
  }});
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  res.json({ success: true, data: user });
});

export const getPeers = asyncHandler(async (req, res) => {
  const me = await User.findById(req.params.id).select("classId").lean();
  if (!me?.classId) return res.json({ success: true, data: [] });

  const peers = await User.find({
    classId: me.classId,
    role: "student",
    status: "active",
    _id: { $ne: req.params.id },
  })
    .select("_id fullName")
    .lean();

  res.json({
    success: true,
    data: peers.map((p) => ({ userId: p._id.toString(), name: p.fullName, available: true })),
  });
});
