import StudentStat from "../models/student_stats.model.js";
import ChatLog from "../models/chat_logs.models.js";
import { getFuelMode, deductFuel } from "../services/fuel.service.js";
import { generateResponse } from "../services/ai.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const { userId, message, subjectId } = req.body;

  const stat = await StudentStat.findOne({ userId });
  const fuel = stat?.brainFuel ?? 0;
  const mode = getFuelMode(fuel);

  const recentLogs = await ChatLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("userMessage assistantReply");

  const chatHistory = recentLogs.reverse().flatMap((log) => [
    { role: "user", content: log.userMessage },
    { role: "assistant", content: log.assistantReply },
  ]);

  const { reply, tokens } = await generateResponse(message, mode, chatHistory);

  const { newFuel, cost } = await deductFuel(userId, tokens.total || 200);

  await ChatLog.create({
    userId,
    subjectId: subjectId || null,
    userMessage: message,
    assistantReply: reply,
    mode,
    tokens,
    fuelCost: cost,
  });

  await StudentStat.findOneAndUpdate(
    { userId },
    { $inc: { chatCountToday: 1, todayTokenUsed: tokens.total || 0 } }
  );

  res.json({ success: true, data: { reply, mode, brainFuelRemaining: newFuel, fuelCost: cost, tokens } });
});

export const getHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const logs = await ChatLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);

  const history = logs.reverse().flatMap((log) => [
    { role: "user", content: log.userMessage, mode: log.mode, createdAt: log.createdAt },
    { role: "assistant", content: log.assistantReply, mode: log.mode, fuelCost: log.fuelCost, createdAt: log.createdAt },
  ]);

  res.json({ success: true, data: history });
});
