import StudentStat from "../models/student_stats.model.js";
import ChatLog from "../models/chat_logs.models.js";
import Subject from "../models/subjects.model.js";
import { getFuelMode, deductFuelByType } from "../services/fuel.service.js";
import { detectIntent, decideAssistanceLevel, generateResponse } from "../services/ai.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const ASSISTANCE_LABELS = {
  socratic_probe: "Thinking prompt",
  socratic_abuse: "Reflection required",
  hint: "Hint",
  guided_steps: "Guided steps",
  full_explain: "Full explanation",
  locked: "Locked",
};

export const sendMessage = asyncHandler(async (req, res) => {
  const { userId, message, subjectId } = req.body;
  if (!subjectId) throw new AppError("subjectId is required", 400);

  const [stat, subject] = await Promise.all([
    StudentStat.findOne({ userId }),
    Subject.findById(subjectId).select("name"),
  ]);

  const fuel = stat?.brainFuel ?? 0;
  const fuelMode = getFuelMode(fuel);
  const answerSeekStreak = stat?.answerSeekStreak ?? 0;

  const intent = detectIntent(message);
  const { assistanceLevel, streakMultiplier } = decideAssistanceLevel(intent, fuelMode, answerSeekStreak);

  // Fetch last 10 messages for this subject only
  const recentLogs = await ChatLog.find({ userId, subjectId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("userMessage assistantReply");

  const chatHistory = recentLogs.reverse().flatMap((log) => [
    { role: "user", content: log.userMessage },
    { role: "assistant", content: log.assistantReply },
  ]);

  const { reply, tokens } = await generateResponse(message, assistanceLevel, chatHistory, subject?.name);

  const { newFuel, cost } = await deductFuelByType(userId, assistanceLevel, streakMultiplier);

  await ChatLog.create({
    userId,
    subjectId,
    userMessage: message,
    assistantReply: reply,
    mode: assistanceLevel,
    tokens,
    fuelCost: cost,
  });

  // Update streak and chat count atomically
  const streakUpdate = intent === "showing_work"
    ? { $set: { answerSeekStreak: 0 }, $inc: { chatCountToday: 1, todayTokenUsed: tokens.total || 0 } }
    : intent === "answer_seeking"
    ? { $inc: { answerSeekStreak: 1, chatCountToday: 1, todayTokenUsed: tokens.total || 0 } }
    : { $inc: { chatCountToday: 1, todayTokenUsed: tokens.total || 0 } };

  await StudentStat.findOneAndUpdate({ userId }, streakUpdate);

  res.json({
    success: true,
    data: {
      reply,
      mode: fuelMode,
      assistanceLevel,
      assistanceLabel: ASSISTANCE_LABELS[assistanceLevel],
      intent,
      brainFuelRemaining: newFuel,
      fuelCost: cost,
    },
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const { userId, subjectId } = req.params;
  const filter = { userId };
  if (subjectId) filter.subjectId = subjectId;

  const logs = await ChatLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(50);

  const history = logs.reverse().flatMap((log) => [
    { role: "user", content: log.userMessage, mode: log.mode, createdAt: log.createdAt },
    {
      role: "assistant",
      content: log.assistantReply,
      mode: log.mode,
      assistanceLevel: log.mode,
      fuelCost: log.fuelCost,
      createdAt: log.createdAt,
    },
  ]);

  res.json({ success: true, data: history });
});
