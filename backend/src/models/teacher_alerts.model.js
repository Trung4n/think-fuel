import mongoose from "mongoose";

const teacherAlertSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },

    type: String,
    message: String,

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("TeacherAlert", teacherAlertSchema);
