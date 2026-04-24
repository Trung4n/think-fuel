import mongoose from "mongoose";

const nodeSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
    type: { type: String, enum: ["start", "normal", "enemy", "puzzle", "boss", "wall"] },
    cleared: { type: Boolean, default: false },
    connections: [{ x: Number, y: Number }],
  },
  { _id: false }
);

const encounterSchema = new mongoose.Schema(
  {
    nodeX: Number,
    nodeY: Number,
    nodeType: String,
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" },
    answered: { type: Boolean, default: false },
  },
  { _id: false }
);

const bossStateSchema = new mongoose.Schema(
  {
    active: { type: Boolean, default: false },
    step: { type: Number, default: 0 },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" }],
    stepsCompleted: { type: Number, default: 0 },
  },
  { _id: false }
);

const dungeonSessionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    level:    { type: Number, default: 1 },
    status:   { type: String, enum: ["active", "completed", "dead"], default: "active" },

    map:        [nodeSchema],
    playerPos:  { x: { type: Number, default: 0 }, y: { type: Number, default: 2 } },

    hp:     { type: Number, default: 100 },
    maxHp:  { type: Number, default: 100 },

    encounter: { type: encounterSchema, default: null },
    bossState: { type: bossStateSchema, default: () => ({ active: false, step: 0, questionIds: [], stepsCompleted: 0 }) },

    usedQuestionIds: [{ type: mongoose.Schema.Types.ObjectId }],

    stats: {
      enemiesDefeated:    { type: Number, default: 0 },
      puzzlesSolved:      { type: Number, default: 0 },
      questionsAnswered:  { type: Number, default: 0 },
      totalDamageReceived:{ type: Number, default: 0 },
    },

    startedAt:   { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("DungeonSession", dungeonSessionSchema);
