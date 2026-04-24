import mongoose from "mongoose";
import EscapeSession from "../models/escape_sessions.model.js";
import QuizQuestion from "../models/quiz_questions.model.js";
import StudentStat from "../models/student_stats.model.js";
import { rewardFuel, deductFuelByType } from "../services/fuel.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const TOTAL_STAGES = 5;
const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };

// ── Helpers ─────────────────────────────────────────────────────────

async function selectQuestions(subjectId) {
  // Sample generously then sort easy → medium → hard for progressive difficulty
  const pool = await QuizQuestion.aggregate([
    { $match: { subjectId: new mongoose.Types.ObjectId(subjectId) } },
    { $sample: { size: 20 } },
  ]);
  if (pool.length === 0) return [];
  pool.sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1));
  return pool.slice(0, TOTAL_STAGES);
}

function generateHint(question) {
  if (question.tags?.length > 0) return `Think about: "${question.tags[0]}"`;
  if (question.explanation) {
    const first = question.explanation.split(/[.!?]/)[0].trim();
    if (first.length > 15) return first;
  }
  return `Focus on the core concept of "${question.topic || "this topic"}"`;
}

function safeQuestion(q) {
  const obj = q.toObject ? q.toObject() : { ...q };
  const { correctAnswer, questionText, _id, ...rest } = obj;
  return { ...rest, questionId: _id, question: questionText };
}

// ── Endpoints ────────────────────────────────────────────────────────

export const startRoom = asyncHandler(async (req, res) => {
  const { userId, subjectId } = req.body;
  if (!userId || !subjectId) throw new AppError("userId and subjectId required", 400);

  // Resume existing active session
  const existing = await EscapeSession.findOne({ userId, subjectId, status: "active" });
  if (existing) {
    return res.json({ success: true, data: { sessionId: existing._id, resumed: true } });
  }

  const questions = await selectQuestions(subjectId);
  if (questions.length === 0) throw new AppError("No questions available for this subject", 404);

  const session = await EscapeSession.create({
    userId,
    subjectId,
    totalStages: questions.length,
    questionIds: questions.map((q) => q._id),
  });

  res.status(201).json({ success: true, data: { sessionId: session._id, resumed: false } });
});

export const getChallenge = asyncHandler(async (req, res) => {
  const session = await EscapeSession.findById(req.params.sessionId);
  if (!session) throw new AppError("Session not found", 404);

  if (session.status === "completed") {
    return res.json({
      success: true,
      data: { status: "completed", session: serializeSession(session) },
    });
  }

  const qIndex = session.currentStage - 1;
  const qId = session.questionIds[qIndex];
  if (!qId) throw new AppError("No question for this stage", 404);

  const question = await QuizQuestion.findById(qId);
  if (!question) throw new AppError("Question not found", 404);

  res.json({
    success: true,
    data: {
      session: serializeSession(session),
      challenge: safeQuestion(question),
    },
  });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const { sessionId, answer } = req.body;
  if (!sessionId || !answer) throw new AppError("sessionId and answer required", 400);

  const session = await EscapeSession.findById(sessionId);
  if (!session) throw new AppError("Session not found", 404);
  if (session.status === "completed") throw new AppError("Room already escaped", 400);

  const question = await QuizQuestion.findById(session.questionIds[session.currentStage - 1]);
  const isCorrect = question.correctAnswer === answer;

  if (!isCorrect) {
    return res.json({ success: true, data: { correct: false, explanation: null } });
  }

  // Advance stage
  const newCompleted = session.completedStages + 1;
  const isEscaped = newCompleted >= session.totalStages;

  // Fuel reward for correct stage answer
  const stageReward = await rewardFuel(session.userId.toString(), "correct_quiz_answer");
  let completionBonus = 0;
  let finalFuel = stageReward.newFuel;

  if (isEscaped) {
    const bonus = await rewardFuel(session.userId.toString(), "independent_quiz");
    completionBonus = bonus.added;
    finalFuel = bonus.newFuel;
  }

  await EscapeSession.findByIdAndUpdate(sessionId, {
    completedStages: newCompleted,
    currentStage: session.currentStage + 1,
    fuelEarned: session.fuelEarned + stageReward.added + completionBonus,
    ...(isEscaped ? { status: "completed", completedAt: new Date() } : {}),
  });

  res.json({
    success: true,
    data: {
      correct: true,
      escaped: isEscaped,
      explanation: question.explanation,
      stageReward: stageReward.added,
      completionBonus,
      newFuel: finalFuel,
      completedStages: newCompleted,
    },
  });
});

export const useHint = asyncHandler(async (req, res) => {
  const session = await EscapeSession.findById(req.params.sessionId);
  if (!session) throw new AppError("Session not found", 404);
  if (session.status === "completed") throw new AppError("Room already escaped", 400);

  const stat = await StudentStat.findOne({ userId: session.userId });
  if (!stat || stat.brainFuel < 15) {
    throw new AppError("Not enough Brain Fuel for a hint (need 15)", 400);
  }

  const question = await QuizQuestion.findById(session.questionIds[session.currentStage - 1]);
  const { newFuel } = await deductFuelByType(session.userId.toString(), "hint");

  await EscapeSession.findByIdAndUpdate(session._id, { $inc: { hintsUsed: 1 } });

  res.json({ success: true, data: { hint: generateHint(question), newFuel } });
});

export const getSession = asyncHandler(async (req, res) => {
  const { userId, subjectId } = req.params;
  const session = await EscapeSession
    .findOne({ userId, subjectId, status: "active" })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: session ? serializeSession(session) : null });
});

function serializeSession(s) {
  return {
    sessionId: s._id,
    status: s.status,
    currentStage: s.currentStage,
    totalStages: s.totalStages,
    completedStages: s.completedStages,
    hintsUsed: s.hintsUsed,
    fuelEarned: s.fuelEarned,
  };
}
