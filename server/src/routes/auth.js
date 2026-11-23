import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};
const issueToken = (user) => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email });

router.post("/register",
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2–80 characters"),
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").isLength({ min: 8, max: 72 }).withMessage("Password must be at least 8 characters"),
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "Email is already registered" });
      const user = await User.create({ name, email: normalizedEmail, password: await bcrypt.hash(password, 12) });
      res.status(201).json({ token: issueToken(user), user: safeUser(user) });
    } catch (err) { next(err); }
  }
);

router.post("/login",
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email.toLowerCase().trim() }).select("+password");
      if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ message: "Invalid email or password" });
      res.json({ token: issueToken(user), user: safeUser(user) });
    } catch (err) { next(err); }
  }
);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: safeUser(user) });
  } catch (err) { next(err); }
});

export default router;
