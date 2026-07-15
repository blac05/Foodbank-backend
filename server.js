import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";

import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import missionRoutes from "./routes/missions.js";
import orderRoutes from "./routes/orders.js";
import impactRoutes from "./routes/impact.js";
import lockerRoutes from "./routes/lockers.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));

// Tighter limit for auth (brute-force protection) and a looser one for
// general write traffic (donations/orders) to slow down listing/order spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts — please try again shortly." },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests — please slow down and try again shortly." },
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "foodbank-backend" }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/donations", writeLimiter, donationRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/orders", writeLimiter, orderRoutes);
app.use("/api/impact", impactRoutes);
app.use("/api/lockers", lockerRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, _next) => {
  req.log?.error({ err }, "unhandled error");
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => logger.info(`Food Bank API running on port ${PORT}`));
});