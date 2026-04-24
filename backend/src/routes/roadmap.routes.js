import express from "express";
import { getRoadmap } from "../controllers/roadmap.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/:userId", authenticate, getRoadmap);
export default router;
