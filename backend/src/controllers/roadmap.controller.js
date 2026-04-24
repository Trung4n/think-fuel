import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { generateRoadmap } from "../services/roadmap.service.js";

export const getRoadmap = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Students can only view their own roadmap; teachers can view any
  if (req.user.role === "student" && req.user.id !== userId) {
    throw new AppError("Forbidden", 403);
  }

  const { roadmap, explanation } = await generateRoadmap(userId);
  res.json({ success: true, data: { roadmap, explanation } });
});
