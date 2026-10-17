import { Router } from "express";
import {
  getMoments,
  createMoment,
  getMomentById,
  deleteMoment,
} from "../controllers/moment.controller.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validate.js";
import {
  CreateMomentSchema,
  GetMomentsQuerySchema,
  MomentIdParamSchema,
} from "../../../shared/schemas/moment.schema.js";

export const momentRouter = Router();

// GET /api/moments - Paginated and filtered list of moments
momentRouter.get("/", validateQuery(GetMomentsQuerySchema), getMoments);

// POST /api/moments - Create a new moment
momentRouter.post("/", validateBody(CreateMomentSchema), createMoment);

// GET /api/moments/:id - Get a single moment by ID
momentRouter.get("/:id", validateParams(MomentIdParamSchema), getMomentById);

// DELETE /api/moments/:id - Delete a single moment by ID
momentRouter.delete("/:id", validateParams(MomentIdParamSchema), deleteMoment);
