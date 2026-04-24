import Class from "../models/classes.model.js";
import StudentStat from "../models/student_stats.model.js";
import TeacherAlert from "../models/teacher_alerts.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.params.id;
  const cls = await Class.findOne({ teacherId });
  if (!cls) return res.json({ success: true, data: { className: null, totalStudents: 0, avgDependencyScore: 0, atRiskStudents: 0 } });

  const stats = await StudentStat.find({ userId: { $in: cls.studentIds } });
  const avgDependencyScore = stats.length
    ? Math.round(stats.reduce((s, x) => s + x.dependencyScore, 0) / stats.length)
    : 0;
  const atRiskStudents = stats.filter((s) => s.dependencyScore > 60).length;

  res.json({ success: true, data: {
    className: cls.name,
    totalStudents: cls.studentIds.length,
    avgDependencyScore,
    atRiskStudents,
  }});
});

export const getStudents = asyncHandler(async (req, res) => {
  const teacherId = req.params.id;
  const cls = await Class.findOne({ teacherId }).populate("studentIds", "fullName email");
  if (!cls) return res.json({ success: true, data: [] });

  const stats = await StudentStat.find({ userId: { $in: cls.studentIds.map((s) => s._id) } });
  const statMap = Object.fromEntries(stats.map((s) => [s.userId.toString(), s]));

  const students = cls.studentIds.map((student) => {
    const stat = statMap[student._id.toString()];
    const dep = stat?.dependencyScore ?? 0;
    const risk = dep > 60 ? "high" : dep > 30 ? "medium" : "low";
    return {
      id: student._id,
      name: student.fullName,
      brainFuel: stat?.brainFuel ?? 1000,
      dependencyScore: dep,
      independenceScore: stat?.independenceScore ?? 0,
      risk,
    };
  });

  res.json({ success: true, data: students });
});

export const getAlerts = asyncHandler(async (req, res) => {
  const teacherId = req.params.id;
  const alerts = await TeacherAlert.find({ teacherId })
    .sort({ createdAt: -1 })
    .populate("studentId", "fullName")
    .populate("subjectId", "name");
  res.json({ success: true, data: alerts });
});
