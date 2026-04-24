import express from "express";
import Subject from "../models/subjects.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();
router.get("/", asyncHandler(async (req, res) => {
  const subjects = await Subject.find();
  res.json({ success: true, data: subjects });
}));
export default router;
