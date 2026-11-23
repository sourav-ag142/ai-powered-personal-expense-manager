import { Router } from "express";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";
import Transaction from "../models/Transaction.js";

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};
const rules = [
  body("title").trim().isLength({ min: 1, max: 120 }).withMessage("Title is required (max 120 characters)"),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than zero"),
  body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  body("category").trim().isLength({ min: 1, max: 40 }).withMessage("Category is required"),
  body("date").optional().isISO8601().withMessage("Date must be valid")
];
const ownerQuery = (req) => ({ _id: req.params.id, user: req.userId });

router.get("/", async (req, res, next) => {
  try {
    const filter = { user: req.userId };
    if (["income", "expense"].includes(req.query.type)) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) { const to = new Date(req.query.to); to.setHours(23, 59, 59, 999); filter.date.$lte = to; }
    }
    const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 }).limit(500);
    res.json({ transactions });
  } catch (err) { next(err); }
});

router.get("/summary", async (req, res, next) => {
  try {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    const rows = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId), date: { $gte: start } } },
      { $group: { _id: { type: "$type", category: "$category" }, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    const summary = { income: 0, expenses: 0, categories: [] };
    for (const row of rows) {
      if (row._id.type === "income") summary.income += row.total;
      else { summary.expenses += row.total; summary.categories.push({ category: row._id.category, total: row.total }); }
    }
    summary.balance = summary.income - summary.expenses;
    res.json({ summary });
  } catch (err) { next(err); }
});

router.post("/", rules, validate, async (req, res, next) => {
  try {
    const transaction = await Transaction.create({ ...req.body, user: req.userId });
    res.status(201).json({ transaction });
  } catch (err) { next(err); }
});

router.patch("/:id", rules, validate, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(ownerQuery(req), req.body, { new: true, runValidators: true });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ transaction });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete(ownerQuery(req));
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch (err) { next(err); }
});

export default router;
