import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.model.js";
import StudentStat from "../models/student_stats.model.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401);
  }
  const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ success: true, data: { token, user: { id: user._id, name: user.fullName, role: user.role } } });
});

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role = "student" } = req.body;
  if (!fullName || !email || !password) {
    throw new AppError("fullName, email, and password are required", 400);
  }
  if (!["student", "teacher"].includes(role)) {
    throw new AppError("role must be student or teacher", 400);
  }
  const existing = await User.findOne({ email });
  if (existing) throw new AppError("Email already in use", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash, role });

  if (role === "student") {
    await StudentStat.create({ userId: user._id });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({
    success: true,
    data: { token, user: { id: user._id, name: user.fullName, role: user.role } },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  res.json({ success: true, data: { user } });
});
