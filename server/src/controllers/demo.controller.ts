import { Request, Response } from "express";
import { seedDatabase, resetDatabase } from "../seed/seedData.js";
import { DemoResetSchema } from "../../../shared/schemas/moment.schema.js";
import { config } from "../config/env.js";

export async function handleSeedDemo(req: Request, res: Response): Promise<void> {
  try {
    const result = await seedDatabase(config.demoUserId);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to seed demo data",
        details: [err.message],
      },
    });
  }
}

export async function handleResetDemo(req: Request, res: Response): Promise<void> {
  const parsed = DemoResetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        details: parsed.error.errors,
      },
    });
    return;
  }

  try {
    const result = await resetDatabase(config.demoUserId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to reset demo data",
        details: [err.message],
      },
    });
  }
}
