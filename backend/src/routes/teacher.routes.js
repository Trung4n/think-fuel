import express from "express";
import { getDashboard, getStudents, getAlerts } from "../controllers/teacher.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/:id/dashboard", authenticate, getDashboard);
router.get("/:id/students", authenticate, getStudents);
router.get("/:id/alerts", authenticate, getAlerts);
export default router;
