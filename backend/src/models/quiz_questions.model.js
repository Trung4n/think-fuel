import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
    },

    topic: String,
    difficulty: { type: String, enum: ["easy", "medium", "hard"], index: true },

    questionText: String,

    choices: [String],
    correctAnswer: String,

    explanation: String,

    tags: [String],
  },
  { timestamps: true },
);

export default mongoose.model("QuizQuestion", quizQuestionSchema);
