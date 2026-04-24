import StudentStat from "../models/student_stats.model.js";
import QuizQuestion from "../models/quiz_questions.model.js";
import QuizAttempt from "../models/quiz_attempts.model.js";
import { rewardFuel } from "../services/fuel.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNextQuestion = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const stat = await StudentStat.findOne({ userId });
  const streak = stat?.correctStreak ?? 0;
  const difficulty = streak >= 5 ? "hard" : streak >= 2 ? "medium" : "easy";

  const count = await QuizQuestion.countDocuments({ difficulty });
  const skip = Math.floor(Math.random() * count);
  const question = await QuizQuestion.findOne({ difficulty }).skip(skip);

  if (!question) return res.json({ success: true, data: null });

  const { correctAnswer, questionText, _id, ...rest } = question.toObject();
  res.json({ success: true, data: { ...rest, questionId: _id, question: questionText } });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const { userId, questionId, answer } = req.body;
  const question = await QuizQuestion.findById(questionId);
  const isCorrect = question.correctAnswer === answer;

  let rewardResult = { newFuel: null, added: 0 };

  if (isCorrect) {
    rewardResult = await rewardFuel(userId, "correct_quiz_answer");
    await StudentStat.findOneAndUpdate(
      { userId },
      { $inc: { quizCompleted: 1, correctStreak: 1 } }
    );
  } else {
    await StudentStat.findOneAndUpdate(
      { userId },
      { $inc: { quizCompleted: 1 }, $set: { correctStreak: 0 } }
    );
  }

  await QuizAttempt.create({
    userId,
    subjectId: question.subjectId,
    questionId,
    answer,
    isCorrect,
    rewardFuel: rewardResult.added,
  });

  res.json({ success: true, data: {
    correct: isCorrect,
    explanation: question.explanation,
    rewardFuel: rewardResult.added,
    newFuel: rewardResult.newFuel,
  }});
});
