import express from "express";
import { getNextQuestion, submitAnswer } from "../controllers/quiz.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/next/:userId/:subjectId", authenticate, getNextQuestion); // subject-scoped (primary)
router.get("/next/:userId", authenticate, getNextQuestion);            // global (backward compat)
router.post("/submit", authenticate, submitAnswer);
export default router;
