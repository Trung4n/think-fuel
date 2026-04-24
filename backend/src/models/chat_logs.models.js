import mongoose from "mongoose";

const chatLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningSession",
      index: true,
    },

    userMessage: String,
    assistantReply: String,

    mode: { type: String, default: "socratic" },

    tokens: {
      prompt: Number,
      completion: Number,
      total: Number,
    },

    fuelCost: Number,
  },
  { timestamps: true },
);

export default mongoose.model("ChatLog", chatLogSchema);
