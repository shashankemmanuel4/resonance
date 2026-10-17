import { Router } from "express";
import {
  handleGetPreferences,
  handleUpdatePreferences,
} from "../controllers/preferences.controller.js";
import { validateBody } from "../middleware/validate.js";
import { UpdatePreferencesSchema } from "../../../shared/schemas/moment.schema.js";

export const preferencesRouter = Router();

// GET /api/user/preferences
preferencesRouter.get("/preferences", handleGetPreferences);

// PATCH /api/user/preferences
preferencesRouter.patch(
  "/preferences",
  validateBody(UpdatePreferencesSchema),
  handleUpdatePreferences
);
