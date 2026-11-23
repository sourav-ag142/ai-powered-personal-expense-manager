import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import aiRoutes from "./routes/ai.js";
import { requireAuth } from "./middleware/auth.js";
import { notFound, errorHandler } from "./middleware/errors.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "expense-manager-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
connectDB().then(() => app.listen(port, () => console.log(`API listening on http://localhost:${port}`)))
  .catch(err => { console.error("Startup failed:", err); process.exit(1); });
