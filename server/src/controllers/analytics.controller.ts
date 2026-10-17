import { Request, Response } from "express";
import { config } from "../config/env.js";
import { resolveTimezone } from "../utils/timezone.js";
import {
  getEnvironmentalMatrix,
  getChronobiologyDistribution,
  getDistractionImpact,
  getSevenDayPulse,
  getAnalyticsSummary,
} from "../services/analytics.service.js";
import { TimezoneQueryInput } from "../../../shared/schemas/moment.schema.js";

/**
 * GET /api/analytics/pulse?tz=<iana_tz>
 * Dashboard KPIs strictly scoped to previous 7 days.
 */
export async function handleGetPulse(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query as unknown as TimezoneQueryInput;
    const resolvedTz = await resolveTimezone(config.demoUserId, query.tz);

    const data = await getSevenDayPulse(config.demoUserId, resolvedTz);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes("Invalid IANA timezone string")) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: [err.message],
        },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to compute 7-day pulse analytics",
        details: [err.message],
      },
    });
  }
}

/**
 * GET /api/analytics/matrix
 * Environmental correlation matrix (Pipeline 1).
 */
export async function handleGetMatrix(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getEnvironmentalMatrix(config.demoUserId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to compute environmental matrix",
        details: [err.message],
      },
    });
  }
}

/**
 * GET /api/analytics/chronobiology?tz=<iana_tz>
 * Time-of-day focus distribution (Pipeline 2).
 */
export async function handleGetChronobiology(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query as unknown as TimezoneQueryInput;
    const resolvedTz = await resolveTimezone(config.demoUserId, query.tz);

    const data = await getChronobiologyDistribution(config.demoUserId, resolvedTz);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const err = error as Error;
    if (err.message.includes("Invalid IANA timezone string")) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: [err.message],
        },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to compute hourly focus distribution",
        details: [err.message],
      },
    });
  }
}

/**
 * GET /api/analytics/distractions
 * Distraction cost analysis (Pipeline 3).
 */
export async function handleGetDistractions(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getDistractionImpact(config.demoUserId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to compute distraction impact",
        details: [err.message],
      },
    });
  }
}

/**
 * GET /api/analytics/summary
 * All-time total summary statistics.
 */
export async function handleGetSummary(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getAnalyticsSummary(config.demoUserId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to compute analytics summary",
        details: [err.message],
      },
    });
  }
}
