import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import missionRoutes from "./routes/missions.js";
import orderRoutes from "./routes/orders.js";
import impactRoutes from "./routes/impact.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts — please try again shortly." },
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "foodbank-backend" }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/impact", impactRoutes);

// Fallback 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Central error handler
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] Food Bank API running on port ${PORT}`));
});
