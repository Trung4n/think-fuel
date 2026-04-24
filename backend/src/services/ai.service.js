import { env } from "../config/env.js";

// --- Intent detection ---
const ANSWER_SEEKING_PATTERNS = [
  "give me the answer",
  "what is the answer",
  "what's the answer",
  "tell me the answer",
  "tell me the solution",
  "just answer",
  "just tell me",
  "solve this for me",
  "solve it for me",
  "what is the solution",
  "just give me",
  "what are the answers",
  "give me solution",
  "give me the solution",
  "show me the answer",
  "i just need the answer",
  "answer please",
];

const SHOWING_WORK_PATTERNS = [
  "i tried",
  "i think",
  "my answer is",
  "i got",
  "i calculated",
  "i solved",
  "because",
  "i believe",
  "my attempt",
  "i worked out",
  "i did",
];

export function detectIntent(message) {
  const lower = message.toLowerCase();
  if (ANSWER_SEEKING_PATTERNS.some((p) => lower.includes(p))) return "answer_seeking";
  if (SHOWING_WORK_PATTERNS.some((p) => lower.includes(p))) return "showing_work";
  if (/[a-z]\s*=\s*\d|^\d+\s*[\+\-\*\/]/.test(lower)) return "showing_work";
  return "learning";
}

// --- Assistance level decision ---
// Returns { assistanceLevel, streakMultiplier }
export function decideAssistanceLevel(intent, fuelMode, answerSeekStreak) {
  if (fuelMode === "locked") return { assistanceLevel: "locked", streakMultiplier: 1 };

  // Anti-abuse: 3+ consecutive answer seeks → force socratic_abuse
  if (answerSeekStreak >= 3) {
    return { assistanceLevel: "socratic_abuse", streakMultiplier: 1 };
  }

  if (intent === "answer_seeking") {
    // Always gate direct answers: first ask what they tried
    if (answerSeekStreak < 2) return { assistanceLevel: "socratic_probe", streakMultiplier: 1 };
    // Second time asking: give guided steps (never direct answer for free)
    return { assistanceLevel: "guided_steps", streakMultiplier: 1.5 };
  }

  if (intent === "showing_work") {
    // Reward showing work with more helpful response
    if (fuelMode === "full_help") return { assistanceLevel: "full_explain", streakMultiplier: 1 };
    if (fuelMode === "guided") return { assistanceLevel: "guided_steps", streakMultiplier: 1 };
    return { assistanceLevel: "hint", streakMultiplier: 1 };
  }

  // General learning question
  if (fuelMode === "full_help") return { assistanceLevel: "full_explain", streakMultiplier: 1 };
  if (fuelMode === "guided") return { assistanceLevel: "guided_steps", streakMultiplier: 1 };
  return { assistanceLevel: "hint", streakMultiplier: 1 }; // socratic mode
}

// --- System prompts per assistance level ---
const SYSTEM_PROMPTS = {
  socratic_probe: `You are a Socratic learning coach. The student is asking for an answer without showing any attempt.
Ask them warmly but firmly what they have tried so far. Ask ONE specific probing question related to the topic.
Do NOT give any hints, steps, or answers. Keep your response to 1-2 sentences.`,

  socratic_abuse: `The student has been repeatedly asking for direct answers without engaging.
Ask a single probing question that requires them to think about a fundamental concept.
Do not give any answers, hints, or solutions. Be firm but encouraging. 1-2 sentences only.`,

  hint: `You are a learning coach. Give ONE short, targeted hint that points the student in the right direction.
Do not solve the problem. Do not show steps. Maximum 2 sentences.
The hint should make them think, not just copy.`,

  guided_steps: `You are a step-by-step tutor. Walk the student through the problem approach step by step.
Show intermediate steps and reasoning, but pause at the final step and ask them to complete it.
Do NOT give the final numerical answer. Use "What do you get when you..." to end.`,

  full_explain: `You are a thorough tutor. The student has shown their work or engaged meaningfully.
Provide a complete, clear explanation with all steps shown. Include the final answer.
Explain WHY each step works, not just what to do.`,

  locked: `The student's Brain Fuel is depleted.
Say: "Your Brain Fuel is empty. Answer a quiz question to recharge, then come back."
Nothing else.`,
};

const MOCK_RESPONSES = {
  socratic_probe: "Before I help, what have you tried so far? Walk me through your thinking.",
  socratic_abuse: "You've asked for answers several times. Let's think differently — what concept do you think applies to this type of problem?",
  hint: "Here's a hint: focus on isolating the variable. What operation would move the constant to the other side?",
  guided_steps: "Let's work through this together. Step 1: identify what you're solving for. Step 2: move constants to one side. Step 3: apply the inverse operation. What do you get for Step 2?",
  full_explain: "Great effort showing your work! Here's the complete solution: first isolate the variable by subtracting the constant from both sides, then divide. The final answer follows from applying these operations in order.",
  locked: "Your Brain Fuel is empty. Answer a quiz question to recharge, then come back.",
};

export async function generateResponse(message, assistanceLevel, chatHistory = [], subjectName = "") {
  if (!env.ANTHROPIC_API_KEY) {
    return {
      reply: MOCK_RESPONSES[assistanceLevel] ?? MOCK_RESPONSES.socratic_probe,
      tokens: { prompt: 0, completion: 0, total: 0 },
    };
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const subjectContext = subjectName ? ` The subject being studied is ${subjectName}.` : "";
  const systemPrompt = (SYSTEM_PROMPTS[assistanceLevel] ?? SYSTEM_PROMPTS.socratic_probe) + subjectContext;

  const messages = [
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  const reply = response.content[0].text;
  const tokens = {
    prompt: response.usage.input_tokens,
    completion: response.usage.output_tokens,
    total: response.usage.input_tokens + response.usage.output_tokens,
  };

  return { reply, tokens };
}
