import { z } from "zod";

export const ActivityCategoryEnum = z.enum([
  "deep_work",
  "shallow_work",
  "creative",
  "learning",
  "rest",
  "communication",
]);

export type ActivityCategory = z.infer<typeof ActivityCategoryEnum>;

export const LightingEnum = z.enum([
  "natural",
  "dim",
  "bright",
  "fluorescent",
]);

export type Lighting = z.infer<typeof LightingEnum>;

export const PeoplePresentEnum = z.enum([
  "alone",
  "parallel_work",
  "crowded",
  "meeting",
]);

export type PeoplePresent = z.infer<typeof PeoplePresentEnum>;

export const DEFAULT_DISTRACTION_TAGS = [
  "Phone",
  "Messaging Apps",
  "Background Noise",
  "Fatigue",
  "Hunger",
  "Interruptions",
  "Uncomfortable Environment",
] as const;

export const CreateMomentSchema = z.object({
  // Optional: if omitted, server uses time of submission
  timestamp: z.string().datetime().optional(),

  durationMinutes: z
    .number()
    .int()
    .min(5, "Minimum session length is 5 minutes")
    .max(720, "Maximum session length is 12 hours"),

  activity: z.object({
    category: ActivityCategoryEnum,
    taskName: z.string().trim().min(2, "Task name must be at least 2 characters").max(100, "Task name must not exceed 100 characters"),
  }),

  environment: z.object({
    location: z.string().trim().min(2, "Location must be at least 2 characters").max(50, "Location must not exceed 50 characters"),
    noiseLevel: z.number().int().min(1, "Noise level must be between 1 and 5").max(5, "Noise level must be between 1 and 5"),
    lighting: LightingEnum,
    peoplePresent: PeoplePresentEnum,
  }),

  experience: z.object({
    focusScore: z.number().int().min(1, "Focus score must be between 1 and 5").max(5, "Focus score must be between 1 and 5"),
    energyScore: z.number().int().min(1, "Energy score must be between 1 and 5").max(5, "Energy score must be between 1 and 5"),
    moodScore: z.number().int().min(1, "Mood score must be between 1 and 5").max(5, "Mood score must be between 1 and 5"),
    distractions: z
      .array(z.string().trim().max(30, "Distraction tag cannot exceed 30 characters"))
      .max(10, "Maximum 10 distraction tags per session")
      .default([]),
  }),

  reflection: z.string().trim().max(1000, "Reflection cannot exceed 1000 characters").optional().default(""),
});

// resonanceScore is NOT in this schema — it is computed server-side only
// userId is injected by the server — not accepted from client

export type CreateMomentInput = z.infer<typeof CreateMomentSchema>;

export const UpdatePreferencesSchema = z.object({
  timezone: z.string().trim().min(1, "Timezone is required").refine((tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid IANA timezone string" }),
});

export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

export const DemoResetSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: "Must include { confirm: true } to reset all data" }),
  }),
});

export type DemoResetInput = z.infer<typeof DemoResetSchema>;

export const GetMomentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(20),
  category: ActivityCategoryEnum.optional(),
  location: z.string().trim().min(1, "Location filter cannot be empty").max(50).optional(),
  minFocus: z.coerce.number().int().min(1, "minFocus must be between 1 and 5").max(5, "minFocus must be between 1 and 5").optional(),
  dateFrom: z.string().datetime({ message: "dateFrom must be a valid ISO datetime string" }).optional(),
  dateTo: z.string().datetime({ message: "dateTo must be a valid ISO datetime string" }).optional(),
});

export type GetMomentsQueryInput = z.infer<typeof GetMomentsQuerySchema>;

export const MomentIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid moment ID format (must be 24-character hexadecimal ObjectId)" }),
});

export type MomentIdParamInput = z.infer<typeof MomentIdParamSchema>;

export const TimezoneQuerySchema = z.object({
  tz: z
    .string()
    .trim()
    .refine(
      (tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      },
      { message: "Invalid IANA timezone string" }
    )
    .optional(),
});

export type TimezoneQueryInput = z.infer<typeof TimezoneQuerySchema>;


