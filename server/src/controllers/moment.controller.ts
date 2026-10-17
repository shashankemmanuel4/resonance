import { Request, Response } from "express";
import { Types } from "mongoose";
import { Moment } from "../models/Moment.js";
import { config } from "../config/env.js";
import { CreateMomentInput, GetMomentsQueryInput } from "../../../shared/schemas/moment.schema.js";

/**
 * GET /api/moments
 * Paginated and filtered retrieval of moments for the demo user, sorted newest first.
 */
export async function getMoments(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query as unknown as GetMomentsQueryInput;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Scope strictly to demo user
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(config.demoUserId),
    };

    // Category filter
    if (query.category) {
      filter["activity.category"] = query.category;
    }

    // Location filter (exact match on trimmed string)
    if (query.location) {
      filter["environment.location"] = query.location;
    }

    // Min Focus filter
    if (query.minFocus !== undefined) {
      filter["experience.focusScore"] = { $gte: query.minFocus };
    }

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) {
        dateFilter["$gte"] = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        dateFilter["$lte"] = new Date(query.dateTo);
      }
      filter["timestamp"] = dateFilter;
    }

    const total = await Moment.countDocuments(filter);
    const skip = (page - 1) * limit;

    // Sort newest timestamp first (hits idx_user_timeline)
    const moments = await Moment.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const pages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: {
        moments,
        total,
        page,
        pages,
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch moments",
        details: [err.message],
      },
    });
  }
}

/**
 * POST /api/moments
 * Creates a new moment. Server computes resonanceScore and injects demoUserId.
 */
export async function createMoment(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as CreateMomentInput;

    // Server-computed formula: (focus * 0.6) + (energy * 0.4) rounded to 1 decimal place
    const resonanceScore =
      Math.round(((body.experience.focusScore * 0.6) + (body.experience.energyScore * 0.4)) * 10) / 10;

    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

    const moment = await Moment.create({
      userId: new Types.ObjectId(config.demoUserId),
      timestamp,
      durationMinutes: body.durationMinutes,
      activity: body.activity,
      environment: body.environment,
      experience: body.experience,
      reflection: body.reflection ?? "",
      resonanceScore,
    });

    res.status(201).json({
      success: true,
      data: {
        moment,
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to create moment",
        details: [err.message],
      },
    });
  }
}

/**
 * GET /api/moments/:id
 * Fetches a single moment by ID scoped to the demo user.
 */
export async function getMomentById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params["id"];
    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid moment ID format",
          details: [],
        },
      });
      return;
    }

    const moment = await Moment.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(config.demoUserId),
    }).lean();

    if (!moment) {
      res.status(404).json({
        success: false,
        error: {
          message: "Moment not found",
          details: [],
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        moment,
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch moment",
        details: [err.message],
      },
    });
  }
}

/**
 * DELETE /api/moments/:id
 * Deletes a single moment by ID scoped to the demo user.
 */
export async function deleteMoment(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params["id"];
    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid moment ID format",
          details: [],
        },
      });
      return;
    }

    const deleted = await Moment.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(config.demoUserId),
    });

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          message: "Moment not found",
          details: [],
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        deletedId: id,
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to delete moment",
        details: [err.message],
      },
    });
  }
}
