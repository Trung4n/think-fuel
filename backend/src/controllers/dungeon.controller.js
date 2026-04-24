import DungeonSession from "../models/dungeon_session.model.js";
import QuizQuestion from "../models/quiz_questions.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// ── Map layout (fixed cross shape, node types randomized) ─────────────

const ACTIVE_POSITIONS = [
  [0,2],[1,2],[2,2],[3,2],[4,2],   // main path
  [1,1],[2,1],[3,1],               // top branch
  [1,3],[2,3],[3,3],               // bottom branch
];

const CONNECTION_MAP = {
  "0,2": [[1,2]],
  "1,2": [[0,2],[2,2],[1,1],[1,3]],
  "2,2": [[1,2],[3,2],[2,1],[2,3]],
  "3,2": [[2,2],[4,2],[3,1],[3,3]],
  "4,2": [[3,2]],
  "1,1": [[1,2],[2,1]],
  "2,1": [[1,1],[3,1],[2,2]],
  "3,1": [[2,1],[3,2]],
  "1,3": [[1,2],[2,3]],
  "2,3": [[1,3],[3,3],[2,2]],
  "3,3": [[2,3],[3,2]],
};

function generateMap(level) {
  const enemyChance = Math.min(0.2 + (level - 1) * 0.12, 0.55);
  const nodes = [];

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const isActive = ACTIVE_POSITIONS.some(([ax, ay]) => ax === x && ay === y);
      if (!isActive) {
        nodes.push({ x, y, type: "wall", cleared: false, connections: [] });
        continue;
      }

      let type;
      if (x === 0 && y === 2) type = "start";
      else if (x === 4 && y === 2) type = "boss";
      else {
        const r = Math.random();
        if (r < enemyChance) type = "enemy";
        else if (r < enemyChance + 0.25) type = "puzzle";
        else type = "normal";
      }

      const connections = (CONNECTION_MAP[`${x},${y}`] || []).map(([cx, cy]) => ({ x: cx, y: cy }));
      nodes.push({ x, y, type, cleared: type === "start", connections });
    }
  }
  return nodes;
}

// ── Question helpers ──────────────────────────────────────────────────

async function pickQuestion(level, usedIds) {
  const difficulties =
    level === 1 ? ["easy"] :
    level === 2 ? ["easy", "medium"] :
    ["medium", "hard"];

  const filter = { difficulty: { $in: difficulties }, _id: { $nin: usedIds } };
  let count = await QuizQuestion.countDocuments(filter);

  if (count === 0) {
    // fallback: ignore difficulty
    const fb = { _id: { $nin: usedIds } };
    count = await QuizQuestion.countDocuments(fb);
    if (count === 0) {
      // all used — reset and pick any
      const total = await QuizQuestion.countDocuments({ difficulty: { $in: difficulties } });
      if (total === 0) throw new AppError("No questions available", 404);
      return QuizQuestion.findOne({ difficulty: { $in: difficulties } })
        .skip(Math.floor(Math.random() * total));
    }
    return QuizQuestion.findOne(fb).skip(Math.floor(Math.random() * count));
  }
  return QuizQuestion.findOne(filter).skip(Math.floor(Math.random() * count));
}

function safeQ(q) {
  const obj = q.toObject ? q.toObject() : { ...q };
  const { correctAnswer, questionText, _id, ...rest } = obj;
  return { ...rest, questionId: _id, question: questionText };
}

// ── Serializer ────────────────────────────────────────────────────────

function serialize(s) {
  return {
    sessionId:  s._id,
    level:      s.level,
    status:     s.status,
    map:        s.map,
    playerPos:  s.playerPos,
    hp:         s.hp,
    maxHp:      s.maxHp,
    bossActive: s.bossState?.active || false,
    stats:      s.stats,
  };
}

// ── Endpoints ─────────────────────────────────────────────────────────

export const startDungeon = asyncHandler(async (req, res) => {
  const { userId, level = 1 } = req.body;
  if (!userId) throw new AppError("userId required", 400);

  // Resume any active session (dead sessions are excluded)
  const existing = await DungeonSession.findOne({ userId, status: "active" });
  if (existing) {
    return res.json({ success: true, data: serialize(existing) });
  }

  const map = generateMap(Number(level));
  const session = await DungeonSession.create({
    userId,
    level: Number(level),
    map,
    playerPos: { x: 0, y: 2 },
    hp: 100,
    maxHp: 100,
    usedQuestionIds: [],
  });

  res.status(201).json({ success: true, data: serialize(session) });
});

export const getSession = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const session = await DungeonSession.findOne({ userId, status: "active" });
  res.json({ success: true, data: session ? serialize(session) : null });
});

export const movePlayer = asyncHandler(async (req, res) => {
  const { sessionId, targetX, targetY } = req.body;
  if (!sessionId || targetX == null || targetY == null) {
    throw new AppError("sessionId, targetX, targetY required", 400);
  }

  const session = await DungeonSession.findById(sessionId);
  if (!session) throw new AppError("Session not found", 404);
  if (session.status !== "active") throw new AppError("Session not active", 400);
  if (session.bossState?.active) throw new AppError("Resolve boss fight first", 400);
  if (session.encounter && !session.encounter.answered) {
    throw new AppError("Resolve current encounter first", 400);
  }

  const currentNode = session.map.find(
    n => n.x === session.playerPos.x && n.y === session.playerPos.y
  );
  const targetNode = session.map.find(n => n.x === targetX && n.y === targetY);

  if (!targetNode || targetNode.type === "wall") throw new AppError("Invalid position", 400);
  const connected = currentNode?.connections.some(c => c.x === targetX && c.y === targetY);
  if (!connected) throw new AppError("Not adjacent", 400);

  session.playerPos = { x: targetX, y: targetY };
  session.encounter = null;

  // Already cleared or start node — just move, no encounter
  if (targetNode.cleared) {
    await session.save();
    return res.json({ success: true, data: { ...serialize(session), encounter: null, boss: null } });
  }

  // Boss node — start 3-question sequence
  if (targetNode.type === "boss") {
    const used = [...session.usedQuestionIds];
    const qs = [];
    for (let i = 0; i < 3; i++) {
      const q = await pickQuestion(session.level, [...used, ...qs.map(x => x._id)]);
      qs.push(q);
    }
    session.usedQuestionIds.push(...qs.map(q => q._id));
    session.bossState = {
      active: true,
      step: 0,
      questionIds: qs.map(q => q._id),
      stepsCompleted: 0,
    };
    await session.save();
    return res.json({
      success: true,
      data: {
        ...serialize(session),
        encounter: null,
        boss: { step: 0, totalSteps: 3, question: safeQ(qs[0]) },
      },
    });
  }

  // Regular encounter — pick 1 question
  const q = await pickQuestion(session.level, session.usedQuestionIds);
  session.usedQuestionIds.push(q._id);
  session.encounter = {
    nodeX: targetX,
    nodeY: targetY,
    nodeType: targetNode.type,
    questionId: q._id,
    answered: false,
  };
  await session.save();

  res.json({
    success: true,
    data: {
      ...serialize(session),
      encounter: { nodeType: targetNode.type, question: safeQ(q) },
      boss: null,
    },
  });
});

export const submitEncounter = asyncHandler(async (req, res) => {
  const { sessionId, answer } = req.body;
  if (!sessionId || !answer) throw new AppError("sessionId and answer required", 400);

  const session = await DungeonSession.findById(sessionId);
  if (!session) throw new AppError("Session not found", 404);
  if (!session.encounter || session.encounter.answered) {
    throw new AppError("No active encounter", 400);
  }

  const question = await QuizQuestion.findById(session.encounter.questionId);
  const correct = question.correctAnswer === answer;

  // Damage on wrong answer (enemy hurts most)
  const DAMAGE = { enemy: 20, puzzle: 12, normal: 6 };
  const damage = correct ? 0 : (DAMAGE[session.encounter.nodeType] || 8);

  session.hp = Math.max(0, session.hp - damage);
  session.stats.questionsAnswered += 1;
  session.stats.totalDamageReceived += damage;
  if (correct && session.encounter.nodeType === "enemy") session.stats.enemiesDefeated += 1;
  if (correct && session.encounter.nodeType === "puzzle") session.stats.puzzlesSolved += 1;

  // Always clear the node (wrong = damaged but can move on)
  const ni = session.map.findIndex(
    n => n.x === session.encounter.nodeX && n.y === session.encounter.nodeY
  );
  if (ni !== -1) session.map[ni].cleared = true;
  session.markModified("map");
  session.encounter.answered = true;

  const gameOver = session.hp <= 0;
  if (gameOver) session.status = "dead";

  await session.save();
  res.json({
    success: true,
    data: {
      correct,
      damage,
      currentHp: session.hp,
      maxHp: session.maxHp,
      gameOver,
      explanation: question.explanation || null,
      session: serialize(session),
    },
  });
});

export const submitBoss = asyncHandler(async (req, res) => {
  const { sessionId, answer } = req.body;
  if (!sessionId || !answer) throw new AppError("sessionId and answer required", 400);

  const session = await DungeonSession.findById(sessionId);
  if (!session) throw new AppError("Session not found", 404);
  if (!session.bossState?.active) throw new AppError("No active boss fight", 400);

  const { step, questionIds } = session.bossState;
  const question = await QuizQuestion.findById(questionIds[step]);
  const correct = question.correctAnswer === answer;

  // Boss always attacks; damage is lower if correct
  const damage = correct ? 8 : 28;
  session.hp = Math.max(0, session.hp - damage);
  session.stats.questionsAnswered += 1;
  session.stats.totalDamageReceived += damage;
  session.bossState.stepsCompleted += 1;

  const allDone = session.bossState.stepsCompleted >= 3;
  const gameOver = session.hp <= 0;
  let nextQuestion = null;

  if (gameOver) {
    session.status = "dead";
    session.bossState.active = false;
  } else if (allDone) {
    session.status = "completed";
    session.bossState.active = false;
    session.completedAt = new Date();
    const bossIdx = session.map.findIndex(n => n.type === "boss");
    if (bossIdx !== -1) session.map[bossIdx].cleared = true;
    session.markModified("map");
  } else {
    session.bossState.step += 1;
    const nq = await QuizQuestion.findById(questionIds[session.bossState.step]);
    nextQuestion = safeQ(nq);
  }

  await session.save();
  res.json({
    success: true,
    data: {
      correct,
      damage,
      currentHp: session.hp,
      maxHp: session.maxHp,
      gameOver,
      bossDefeated: allDone && !gameOver,
      stepsCompleted: session.bossState.stepsCompleted,
      totalSteps: 3,
      explanation: question.explanation || null,
      nextQuestion,
      session: serialize(session),
    },
  });
});

export const startNextLevel = asyncHandler(async (req, res) => {
  const { userId, completedSessionId } = req.body;
  if (!userId || !completedSessionId) throw new AppError("userId and completedSessionId required", 400);

  const completed = await DungeonSession.findById(completedSessionId);
  if (!completed || completed.status !== "completed") {
    throw new AppError("No completed session found", 400);
  }

  const nextLevel = completed.level + 1;
  const newMaxHp = Math.min(completed.maxHp + 10, 150);
  const newHp = Math.min(completed.hp + 30, newMaxHp);

  const map = generateMap(nextLevel);
  const session = await DungeonSession.create({
    userId,
    level: nextLevel,
    map,
    playerPos: { x: 0, y: 2 },
    hp: newHp,
    maxHp: newMaxHp,
    usedQuestionIds: [],
  });

  res.status(201).json({ success: true, data: serialize(session) });
});
