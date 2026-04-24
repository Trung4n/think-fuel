import mongoose from "mongoose";
import QuizAttempt from "../models/quiz_attempts.model.js";
import QuizQuestion from "../models/quiz_questions.model.js";
import ChatLog from "../models/chat_logs.models.js";
import StudentStat from "../models/student_stats.model.js";
import Subject from "../models/subjects.model.js";
import { env } from "../config/env.js";

// ── Step templates (rule-based, deterministic) ──────────────────────

const STEPS = {
  beginner: [
    {
      week: 1, phase: "Foundation",
      title: "Core Concept Review",
      actions: [
        "Re-read fundamental definitions and formulas",
        "Complete 5 practice problems at easy difficulty",
        "Use the AI tutor for concept clarification — not direct answers",
      ],
      targetAccuracy: 50,
    },
    {
      week: 2, phase: "Practice",
      title: "Guided Problem Solving",
      actions: [
        "Attempt 10 problems and write out every step",
        "Review each wrong answer using hints only",
        "Take a subject quiz to measure progress",
      ],
      targetAccuracy: 60,
    },
    {
      week: 3, phase: "Consolidation",
      title: "Reinforce Weak Spots",
      actions: [
        "Focus practice on your identified weak topics",
        "Try solving each problem before asking for help",
        "Aim for 3 correct quiz answers in a row",
      ],
      targetAccuracy: 65,
    },
  ],
  intermediate: [
    {
      week: 1, phase: "Targeted Practice",
      title: "Weak Topic Deep-Dive",
      actions: [
        "Prioritize your weakest topics this week",
        "Write out full solution steps for every problem",
        "Use hints only — avoid requesting full explanations",
      ],
      targetAccuracy: 65,
    },
    {
      week: 2, phase: "Application",
      title: "Applied Problem Sets",
      actions: [
        "Attempt medium-difficulty problems independently",
        "Understand every mistake before moving on",
        "Make at least 2 solo attempts before using the AI tutor",
      ],
      targetAccuracy: 75,
    },
    {
      week: 3, phase: "Independence",
      title: "Solo Practice Mode",
      actions: [
        "Complete a 10-question quiz without AI assistance",
        "Review results and log remaining knowledge gaps",
        "Hit a target of 3 correct answers in a row",
      ],
      targetAccuracy: 80,
    },
  ],
  advanced: [
    {
      week: 1, phase: "Mastery",
      title: "Challenge Problems",
      actions: [
        "Attempt hard-difficulty problems",
        "Explain your solution process out loud or in writing",
        "Use AI only to verify your reasoning — never for answers",
      ],
      targetAccuracy: 85,
    },
    {
      week: 2, phase: "Synthesis",
      title: "Cross-Topic Connections",
      actions: [
        "Solve problems that combine multiple concepts",
        "Create your own example problems and solve them",
        "Write brief explanations of key concepts in your own words",
      ],
      targetAccuracy: 90,
    },
    {
      week: 3, phase: "Independence",
      title: "Full Independence Challenge",
      actions: [
        "Complete a timed quiz with zero AI assistance",
        "Achieve a streak of 5+ correct answers",
        "Reflect on which strategies improved your performance most",
      ],
      targetAccuracy: 90,
    },
  ],
};

// ── Metrics aggregation ─────────────────────────────────────────────

async function metricsForSubject(userId, subjectId) {
  const [attempts, chatLogs] = await Promise.all([
    QuizAttempt.find({ userId, subjectId }).lean(),
    ChatLog.find({ userId, subjectId }).lean(),
  ]);

  // Quiz accuracy
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const quizAccuracy = totalAttempts > 0
    ? Math.round((correctAttempts / totalAttempts) * 100)
    : null;

  // Weakest topics via wrong answers → look up question topics
  const wrongQuestionIds = attempts
    .filter((a) => !a.isCorrect && a.questionId)
    .map((a) => a.questionId);

  let weakTopics = [];
  if (wrongQuestionIds.length > 0) {
    const wrongQuestions = await QuizQuestion.find(
      { _id: { $in: wrongQuestionIds } },
      { topic: 1 }
    ).lean();
    const failCount = {};
    wrongQuestions.forEach((q) => {
      if (q.topic) failCount[q.topic] = (failCount[q.topic] || 0) + 1;
    });
    weakTopics = Object.entries(failCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  // AI dependency ratio: heavy-help modes / total chats
  const heavyHelp = chatLogs.filter((c) =>
    ["full_explain", "guided_steps"].includes(c.mode)
  ).length;
  const aiDependencyRatio = chatLogs.length > 0
    ? Math.round((heavyHelp / chatLogs.length) * 100)
    : 0;

  // Average fuel cost per chat
  const totalFuel = chatLogs.reduce((s, c) => s + (c.fuelCost || 0), 0);
  const fuelUsageRate = chatLogs.length > 0
    ? Math.round(totalFuel / chatLogs.length)
    : 0;

  // Learning consistency: distinct calendar days with any activity
  const days = new Set(
    [...attempts, ...chatLogs].map((d) =>
      new Date(d.createdAt).toDateString()
    )
  );
  const daysActive = days.size;

  // Determine level from quiz accuracy
  let level = "beginner";
  if (quizAccuracy !== null) {
    if (quizAccuracy >= 70) level = "advanced";
    else if (quizAccuracy >= 40) level = "intermediate";
  }

  return {
    quizAccuracy,
    totalAttempts,
    correctAttempts,
    weakTopics,
    aiDependencyRatio,
    fuelUsageRate,
    daysActive,
    level,
  };
}

// ── Rule engine: build steps from metrics ───────────────────────────

function buildSteps(metrics) {
  const templates = STEPS[metrics.level];
  return templates.map((tpl) => {
    const actions = [...tpl.actions];

    // Inject real weak topics into week-1 action list
    if (tpl.week === 1 && metrics.weakTopics.length > 0) {
      actions.push(`Focus especially on: ${metrics.weakTopics.join(", ")}`);
    }

    // Add dependency-reduction note when ratio is high
    if (tpl.week === 1 && metrics.aiDependencyRatio > 60) {
      actions.push(
        "Your AI usage is high — attempt each problem independently before asking for help"
      );
    }

    return { ...tpl, actions };
  });
}

// ── Overall profile ─────────────────────────────────────────────────

function overallProfile(stat, subjectMetrics) {
  const accuracies = subjectMetrics
    .map((s) => s.metrics.quizAccuracy)
    .filter((v) => v !== null);
  const avgAccuracy = accuracies.length > 0
    ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
    : 0;

  let recommendation = "stay_consistent";
  if (stat) {
    if (stat.dependencyScore > 60) recommendation = "reduce_ai_dependency";
    else if (stat.independenceScore >= 70) recommendation = "challenge_yourself";
    else if (stat.correctStreak >= 5) recommendation = "advance_level";
  }

  return {
    dependencyScore: stat?.dependencyScore ?? 0,
    independenceScore: stat?.independenceScore ?? 0,
    correctStreak: stat?.correctStreak ?? 0,
    brainFuel: stat?.brainFuel ?? 1000,
    avgAccuracy,
    recommendation,
  };
}

// ── AI explanation (strictly constrained to provided data) ──────────

const RECOMMENDATION_TEXT = {
  reduce_ai_dependency: "Focus on attempting problems independently before using the AI tutor.",
  challenge_yourself: "You're performing well — push yourself with harder problems.",
  advance_level: "Your streak is strong — try advancing to the next difficulty level.",
  stay_consistent: "Keep a consistent study schedule to build momentum.",
  balanced: "Maintain a balanced approach between practice and review.",
};

function fallbackExplanation(roadmap) {
  const p = roadmap.overallProfile;
  const recText = RECOMMENDATION_TEXT[p.recommendation] ?? "";
  const subjectSummaries = roadmap.subjects
    .map((s) => {
      const acc =
        s.metrics.quizAccuracy !== null
          ? `${s.metrics.quizAccuracy}% quiz accuracy`
          : "no quiz data yet";
      return `${s.subjectName}: ${s.metrics.level} level (${acc}), starting with "${s.steps[0].title}"`;
    })
    .join("; ");

  return (
    `Your learning profile: dependency score ${p.dependencyScore}, independence score ${p.independenceScore}, ` +
    `current streak ${p.correctStreak}. ${recText} ` +
    `Subject roadmaps — ${subjectSummaries}.`
  );
}

async function generateExplanation(roadmap) {
  if (!env.ANTHROPIC_API_KEY) return fallbackExplanation(roadmap);

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    // Strip step actions from the prompt to keep token count low
    const compactData = {
      overallProfile: roadmap.overallProfile,
      subjects: roadmap.subjects.map((s) => ({
        subjectName: s.subjectName,
        metrics: s.metrics,
        weeklyFocus: s.steps.map((st) => ({
          week: st.week,
          title: st.title,
          targetAccuracy: st.targetAccuracy,
        })),
      })),
    };

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 280,
      system:
        "You are a concise learning coach. Use ONLY the data provided — never invent metrics, topics, or scores. " +
        "Write in second person, warm and encouraging. No bullet points. Under 150 words.",
      messages: [
        {
          role: "user",
          content:
            `Summarize this student's personalized roadmap in 2-3 short paragraphs:\n\n${JSON.stringify(compactData, null, 2)}`,
        },
      ],
    });

    return response.content[0].text.trim();
  } catch {
    return fallbackExplanation(roadmap);
  }
}

// ── Public entry point ──────────────────────────────────────────────

export async function generateRoadmap(userId) {
  const [subjects, stat] = await Promise.all([
    Subject.find().lean(),
    StudentStat.findOne({ userId }).lean(),
  ]);

  const subjectMetrics = await Promise.all(
    subjects.map(async (sub) => {
      const metrics = await metricsForSubject(userId, sub._id);
      return {
        subjectId: sub._id,
        subjectName: sub.name,
        icon: sub.icon || "📚",
        color: sub.color || "#14B8A6",
        metrics,
        steps: buildSteps(metrics),
      };
    })
  );

  const profile = overallProfile(stat, subjectMetrics);

  const roadmap = {
    generatedAt: new Date().toISOString(),
    subjects: subjectMetrics,
    overallProfile: profile,
  };

  const explanation = await generateExplanation(roadmap);

  return { roadmap, explanation };
}
