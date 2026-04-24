import mongoose from "mongoose";

const learningSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    index: true,
  },

  title: String,
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active",
    index: true,
  },

  brainFuelUsed: { type: Number, default: 0 },
  tokensUsed: { type: Number, default: 0 },

  chatCount: { type: Number, default: 0 },
  quizCount: { type: Number, default: 0 },

  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
});

export default mongoose.model("LearningSession", learningSessionSchema);
