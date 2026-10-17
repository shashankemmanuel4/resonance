import { Router } from "express";
import {
  handleGetPulse,
  handleGetMatrix,
  handleGetChronobiology,
  handleGetDistractions,
  handleGetSummary,
} from "../controllers/analytics.controller.js";
import { validateQuery } from "../middleware/validate.js";
import { TimezoneQuerySchema } from "../../../shared/schemas/moment.schema.js";

export const analyticsRouter = Router();

// GET /api/analytics/pulse?tz=<iana_tz>
analyticsRouter.get("/pulse", validateQuery(TimezoneQuerySchema), handleGetPulse);

// GET /api/analytics/matrix
analyticsRouter.get("/matrix", handleGetMatrix);

// GET /api/analytics/chronobiology?tz=<iana_tz>
analyticsRouter.get("/chronobiology", validateQuery(TimezoneQuerySchema), handleGetChronobiology);

// GET /api/analytics/distractions
analyticsRouter.get("/distractions", handleGetDistractions);

// GET /api/analytics/summary
analyticsRouter.get("/summary", handleGetSummary);
