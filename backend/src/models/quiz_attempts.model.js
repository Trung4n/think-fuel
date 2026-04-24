import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
    },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "LearningSession" },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" },

    answer: String,
    isCorrect: Boolean,

    timeSpentSec: Number,
    usedAIHelp: Boolean,

    rewardFuel: Number,
  },
  { timestamps: true },
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);
