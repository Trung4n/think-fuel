import express from "express";
import { sendMessage, getHistory } from "../controllers/chat.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/message", authenticate, sendMessage);
router.get("/history/:userId", authenticate, getHistory);
export default router;
