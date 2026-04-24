import express from "express";
import authRoutes from "./auth.routes.js";
import studentRoutes from "./student.routes.js";
import chatRoutes from "./chat.routes.js";
import teacherRoutes from "./teacher.routes.js";
import quizRoutes from "./quiz.routes.js";
import subjectRoutes from "./subject.routes.js";

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/chat", chatRoutes);
router.use("/teachers", teacherRoutes);
router.use("/quiz", quizRoutes);
router.use("/subjects", subjectRoutes);
export default router;
