import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names safely with clsx.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO UTC timestamp into a human-readable local date and time
 * using Intl.DateTimeFormat with the provided IANA timezone.
 */
export function formatTimestamp(
  dateInput: string | Date,
  timezone = "Asia/Kolkata",
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "Invalid date";

    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return new Intl.DateTimeFormat(undefined, {
      ...defaultOptions,
      ...options,
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a date into a short calendar date string in the target timezone.
 */
export function formatDateOnly(dateInput: string | Date, timezone = "Asia/Kolkata"): string {
  return formatTimestamp(dateInput, timezone, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: undefined,
    minute: undefined,
  });
}

/**
 * Formats duration in minutes into a concise string, e.g. "1h 30m" or "45m".
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Helper to get clean human labels for enums.
 */
export function formatCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    deep_work: "Deep Work",
    shallow_work: "Shallow Work",
    creative: "Creative",
    learning: "Learning",
    rest: "Rest",
    communication: "Communication",
  };
  return map[category] ?? category.replace(/_/g, " ");
}

export function formatLightingLabel(lighting: string): string {
  const map: Record<string, string> = {
    natural: "Natural Light",
    dim: "Dim",
    bright: "Bright",
    fluorescent: "Fluorescent",
  };
  return map[lighting] ?? lighting;
}

export function formatPeopleLabel(people: string): string {
  const map: Record<string, string> = {
    alone: "Alone",
    parallel_work: "Parallel Work",
    crowded: "Crowded",
    meeting: "Meeting",
  };
  return map[people] ?? people.replace(/_/g, " ");
}
