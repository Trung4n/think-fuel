import express from "express";
import {
  startDungeon, getSession, movePlayer,
  submitEncounter, submitBoss, startNextLevel,
} from "../controllers/dungeon.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/start",              authenticate, startDungeon);
router.get("/session/:userId",     authenticate, getSession);
router.post("/move",               authenticate, movePlayer);
router.post("/encounter/submit",   authenticate, submitEncounter);
router.post("/boss/submit",        authenticate, submitBoss);
router.post("/next-level",         authenticate, startNextLevel);
export default router;
