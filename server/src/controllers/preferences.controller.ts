import { Request, Response } from "express";
import { User } from "../models/User.js";
import { config } from "../config/env.js";
import { UpdatePreferencesInput } from "../../../shared/schemas/moment.schema.js";

/**
 * GET /api/user/preferences
 * Retrieves the current user's preferences (timezone).
 */
export async function handleGetPreferences(_req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(config.demoUserId).lean();
    const timezone = user?.preferences?.timezone ?? config.defaultTimezone;

    res.status(200).json({
      success: true,
      data: {
        timezone,
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch user preferences",
        details: [err.message],
      },
    });
  }
}

/**
 * PATCH /api/user/preferences
 * Updates the user's operational timezone preference.
 */
export async function handleUpdatePreferences(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as UpdatePreferencesInput;

    const user = await User.findByIdAndUpdate(
      config.demoUserId,
      { $set: { "preferences.timezone": body.timezone } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: {
        timezone: user.preferences.timezone,
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to update user preferences",
        details: [err.message],
      },
    });
  }
}
