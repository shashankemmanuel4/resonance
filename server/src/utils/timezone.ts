import { Types } from "mongoose";
import { User } from "../models/User.js";
import { config } from "../config/env.js";

/**
 * Validates whether a string is a recognized IANA timezone identifier.
 */
export function isValidIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves operational timezone following strict priority:
 * 1. If suppliedTz is given: validate and use it.
 * 2. If suppliedTz is omitted: load user's stored preference from users.preferences.timezone.
 * 3. If no preference exists: fall back to default ("Asia/Kolkata").
 */
export async function resolveTimezone(
  userId: string | Types.ObjectId,
  suppliedTz?: string
): Promise<string> {
  if (suppliedTz !== undefined && suppliedTz.trim() !== "") {
    const trimmed = suppliedTz.trim();
    if (!isValidIanaTimezone(trimmed)) {
      throw new Error(`Invalid IANA timezone string: "${suppliedTz}"`);
    }
    return trimmed;
  }

  try {
    const user = await User.findById(userId).lean();
    if (user?.preferences?.timezone && isValidIanaTimezone(user.preferences.timezone)) {
      return user.preferences.timezone;
    }
  } catch {
    // Fall through to default if DB lookup fails
  }

  return config.defaultTimezone;
}
