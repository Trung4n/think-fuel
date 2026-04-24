import { env } from "../config/env.js";

const MOCK_RESPONSES = {
  full_help:
    "Great question! Here's a detailed explanation: [topic]. The key concept is [concept]. For example, [example]. Try working through this step by step.",
  guided:
    "Good question. Here's a hint to guide you: think about the relationship between the variables. What approach have you considered so far?",
  socratic:
    "That's an interesting question. What have you tried so far? What do you think the first step should be?",
  locked:
    "Your Brain Fuel is depleted. Take a moment to reflect: what concepts are you struggling with? Try to recall what you learned earlier before asking for help.",
};

const SYSTEM_PROMPTS = {
  full_help:
    "You are a helpful tutor. Provide detailed explanations with examples. Be thorough and educational.",
  guided:
    "You are a Socratic tutor. Give hints and directions, but guide the student to think. Don't give direct answers.",
  socratic:
    "You are a Socratic tutor. Ask questions back. Require the student to attempt a solution first before providing guidance.",
  locked:
    "The student's Brain Fuel is depleted. Do not answer questions. Only provide reflection prompts and encourage them to recall prior learning.",
};

export async function generateResponse(message, mode, chatHistory = []) {
  if (!env.ANTHROPIC_API_KEY) {
    const reply = MOCK_RESPONSES[mode] ?? MOCK_RESPONSES.locked;
    return {
      reply,
      tokens: { prompt: 0, completion: 0, total: 0 },
    };
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const messages = [
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.locked,
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
