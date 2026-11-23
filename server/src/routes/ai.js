import { Router } from "express";
import Transaction from "../models/Transaction.js";

const router = Router();
const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Travel", "Salary", "Freelance", "Other"];

async function askGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const error = new Error("Gemini is not configured. Add GEMINI_API_KEY to server/.env.");
    error.status = 503;
    throw error;
  }
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 700 } })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message || "Gemini request failed");
    error.status = response.status === 429 ? 503 : 502;
    throw error;
  }
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
}

router.post("/categorize", async (req, res, next) => {
  try {
    const { title, note = "", type = "expense" } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Transaction title is required" });
    const prompt = `Classify this personal finance transaction. Return ONLY one category from this list: ${categories.join(", ")}. Type: ${type}. Description: ${title}. Note: ${note}. No explanation.`;
    const raw = (await askGemini(prompt)).trim().replace(/[^a-zA-Z ]/g, "");
    const category = categories.find(c => c.toLowerCase() === raw.toLowerCase()) || "Other";
    res.json({ category });
  } catch (err) { next(err); }
});

router.post("/insights", async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.userId }).sort({ date: -1 }).limit(100);
    if (!transactions.length) return res.json({ insights: "Add a few transactions first, then ask AI to review your spending." });
    const compact = transactions.map(t => ({ title: t.title, amount: t.amount, type: t.type, category: t.category, date: t.date.toISOString().slice(0, 10) }));
    const prompt = `You are a practical personal budgeting assistant. Analyze these recent transactions and give concise, actionable observations: spending patterns, largest categories, possible savings, and one realistic next step. Do not claim certainty, shame the user, or present this as professional financial advice. Currency is unspecified; do not assume one. Data: ${JSON.stringify(compact)}`;
    res.json({ insights: await askGemini(prompt) });
  } catch (err) { next(err); }
});

export default router;
