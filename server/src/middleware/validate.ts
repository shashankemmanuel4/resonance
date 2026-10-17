import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware to validate request body against a Zod schema.
 * Replaces req.body with parsed/coerced data on success.
 * Returns HTTP 400 with standard error envelope on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: result.error.errors,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Middleware to validate query string parameters against a Zod schema.
 * Replaces req.query with parsed/coerced data on success.
 * Returns HTTP 400 with standard error envelope on failure.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: result.error.errors,
        },
      });
      return;
    }
    req.query = result.data as unknown as Request["query"];
    next();
  };
}

/**
 * Middleware to validate URL route parameters against a Zod schema.
 * Replaces req.params with parsed data on success.
 * Returns HTTP 400 with standard error envelope on failure.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: result.error.errors,
        },
      });
      return;
    }
    req.params = result.data as unknown as Request["params"];
    next();
  };
}
