import express from "express";
import {
  startRoom, getChallenge, submitAnswer, useHint, getSession,
} from "../controllers/escape.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/start",                  authenticate, startRoom);
router.get("/challenge/:sessionId",    authenticate, getChallenge);
router.post("/submit",                 authenticate, submitAnswer);
router.post("/hint/:sessionId",        authenticate, useHint);
router.get("/session/:userId/:subjectId", authenticate, getSession);
export default router;
