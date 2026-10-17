import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { demoRouter } from "./routes/demo.routes.js";
import { momentRouter } from "./routes/moment.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { preferencesRouter } from "./routes/preferences.routes.js";

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      service: "RESONANCE API",
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
app.use("/api/demo", demoRouter);
app.use("/api/moments", momentRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/user", preferencesRouter);

// 404 handler for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Endpoint not found",
      details: [],
    },
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Server Error]", err);
  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
      details: [err.message],
    },
  });
});
