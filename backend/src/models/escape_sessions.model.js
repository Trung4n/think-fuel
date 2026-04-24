import mongoose from "mongoose";

const escapeSessionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User",    index: true },
    subjectId:{ type: mongoose.Schema.Types.ObjectId, ref: "Subject", index: true },

    status:          { type: String, enum: ["active", "completed"], default: "active" },
    totalStages:     { type: Number, default: 5 },
    currentStage:    { type: Number, default: 1 },   // 1-indexed
    completedStages: { type: Number, default: 0 },

    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" }],

    hintsUsed:  { type: Number, default: 0 },
    fuelEarned: { type: Number, default: 0 },

    startedAt:   { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

escapeSessionSchema.index({ userId: 1, subjectId: 1 });
export default mongoose.model("EscapeSession", escapeSessionSchema);
