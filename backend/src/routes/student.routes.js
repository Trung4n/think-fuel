import express from "express";
import { getDashboard, getProfile, getPeers } from "../controllers/student.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/:id/dashboard", authenticate, getDashboard);
router.get("/:id/profile", authenticate, getProfile);
router.get("/:id/peers", authenticate, getPeers);
export default router;
