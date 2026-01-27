import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authenticateToken } from "./middleware/auth";

// Routes
import authRoutes from "./routes/auth";
import hubRoutes from "./routes/hubs";
import linkRoutes from "./routes/links";
import ruleRoutes from "./routes/rules";
import analyticsRoutes from "./routes/analytics";
import publicRoutes from "./routes/public";

dotenv.config();

const app: Express = express();

/**
 * Middleware Setup
 */

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// More strict rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts, please try again later",
  skipSuccessfulRequests: true,
});

/**
 * Routes
 */

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Authentication routes
app.use("/api/auth", authLimiter, authRoutes);

// Hub routes (authenticated)
app.use("/api/hubs", hubRoutes);

// Link routes (authenticated)
app.use("/api/hubs/:hubId/links", linkRoutes);

// Rule routes (authenticated)
app.use("/api/hubs/:hubId/rules", ruleRoutes);

// Analytics routes (authenticated)
app.use("/api", analyticsRoutes);

// Public routes (NO authentication)
app.use("/api/public", publicRoutes);

/**
 * Error Handling
 */

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

/**
 * Start Server
 */
export function startServer() {
  app.listen(config.PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  Smart Link Hub Generator              ║
║  Backend Server Running                ║
╠════════════════════════════════════════╣
║  Environment: ${config.NODE_ENV.toUpperCase().padEnd(29)}║
║  Port: ${config.PORT.toString().padEnd(34)}║
║  Database: Connected                  ║
║  API: http://localhost:${config.PORT.toString().padEnd(18)}║
╚════════════════════════════════════════╝
    `);
  });
}

export default app;
