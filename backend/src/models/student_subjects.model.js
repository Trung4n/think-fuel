import mongoose from "mongoose";

const studentSubjectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
    },

    progress: { type: Number, default: 0 },
    level: { type: String, default: "beginner" },

    dependencyScore: { type: Number, default: 0 },
    independenceScore: { type: Number, default: 0 },

    lastStudiedAt: Date,
  },
  { timestamps: true },
);

studentSubjectSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

export default mongoose.model("StudentSubject", studentSubjectSchema);
