import mongoose from "mongoose";

const studentStatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

    brainFuel: { type: Number, default: 1000 },
    maxFuel: { type: Number, default: 1000 },

    dependencyScore: { type: Number, default: 0, index: true },
    independenceScore: { type: Number, default: 0 },

    todayTokenUsed: { type: Number, default: 0 },
    weeklyTokenUsed: { type: Number, default: 0 },

    chatCountToday: { type: Number, default: 0 },
    quizCompleted: { type: Number, default: 0 },
    correctStreak: { type: Number, default: 0 },

    lastActiveAt: { type: Date, index: true },
  },
  { timestamps: true },
);

export default mongoose.model("StudentStat", studentStatSchema);
