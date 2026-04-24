import mongoose from "mongoose";

const dailyAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

  date: { type: String, index: true },

  tokensUsed: Number,
  fuelStart: Number,
  fuelEnd: Number,

  chatCount: Number,
  quizCount: Number,

  dependencyScore: Number,
});

dailyAnalyticsSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyAnalytics", dailyAnalyticsSchema);
