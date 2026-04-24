import mongoose from "mongoose";

const fuelTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    type: { type: String, enum: ["debit", "credit"], index: true },
    amount: Number,

    reason: String,

    metadata: {
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LearningSession",
      },
    },

    balanceAfter: Number,
  },
  { timestamps: true },
);

export default mongoose.model("FuelTransaction", fuelTransactionSchema);
