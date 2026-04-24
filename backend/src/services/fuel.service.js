import StudentStat from "../models/student_stats.model.js";
import FuelTransaction from "../models/fuel_transactions.model.js";

export function getFuelMode(fuel) {
  if (fuel > 700) return "full_help";
  if (fuel >= 300) return "guided";
  if (fuel >= 1) return "socratic";
  return "locked";
}

export async function deductFuel(userId, tokens) {
  const cost = Math.min(80, Math.max(20, Math.ceil(tokens / 10)));
  const current = await StudentStat.findOne({ userId }, "brainFuel maxFuel dependencyScore");
  const newFuel = Math.max(0, (current?.brainFuel ?? 0) - cost);
  const newDep = Math.min(100, (current?.dependencyScore ?? 0) + 2);

  await StudentStat.findOneAndUpdate(
    { userId },
    { $set: { brainFuel: newFuel, lastActiveAt: new Date(), dependencyScore: newDep, independenceScore: Math.max(0, 100 - newDep) } }
  );

  await FuelTransaction.create({ userId, type: "debit", amount: cost, reason: "chat", balanceAfter: newFuel });

  return { newFuel, cost };
}

const REWARDS = {
  solve_before_asking: 80,
  correct_streak: 100,
  explain_reasoning: 120,
  independent_quiz: 150,
  correct_quiz_answer: 50,
};

export async function rewardFuel(userId, action) {
  const added = REWARDS[action] ?? 0;
  const current = await StudentStat.findOne({ userId }, "brainFuel maxFuel dependencyScore");
  const newFuel = Math.min(current?.maxFuel ?? 1000, (current?.brainFuel ?? 0) + added);
  const newDep = Math.max(0, (current?.dependencyScore ?? 0) - 1);

  await StudentStat.findOneAndUpdate(
    { userId },
    { $set: { brainFuel: newFuel, dependencyScore: newDep, independenceScore: Math.min(100, 100 - newDep) } }
  );

  await FuelTransaction.create({ userId, type: "credit", amount: added, reason: action, balanceAfter: newFuel });

  return { newFuel, added };
}
