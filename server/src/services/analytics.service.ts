import { Types } from "mongoose";
import { Moment } from "../models/Moment.js";

export interface EnvironmentalMatrixItem {
  location: string;
  lighting: string;
  noiseLevel: number;
  sessionCount: number;
  totalMinutes: number;
  avgFocus: number;
  avgEnergy: number;
  avgResonance: number;
}

export interface ChronobiologyItem {
  hour: number;
  momentCount: number;
  totalDuration: number;
  avgFocus: number;
  avgEnergy: number;
}

export interface DistractionImpactItem {
  distraction: string;
  occurrences: number;
  avgFocus: number;
  baselineFocus: number;
  totalSessions: number;
  focusDelta: number;
}

export interface PulseWeekStats {
  sessionCount: number;
  totalLoggedMinutes: number;
  avgFocus: number;
  avgEnergy: number;
  avgResonance: number;
}

export interface PulseTopLocation {
  location: string;
  avgResonance: number;
  count: number;
}

export interface PulseDailyTrendItem {
  date: string;
  avgFocus: number;
  avgEnergy: number;
  sessions: number;
}

export interface SevenDayPulseResult {
  weekStats: PulseWeekStats | null;
  topLocation: PulseTopLocation | null;
  dailyTrend: PulseDailyTrendItem[];
}

export interface AnalyticsSummaryResult {
  totalMoments: number;
  totalMinutes: number;
  avgFocus: number;
  avgEnergy: number;
  avgResonance: number;
}

/**
 * Pipeline 1: Environmental Matrix
 * Endpoint: GET /api/analytics/matrix
 * Finds location/lighting/noise combinations associated with highest self-reported focus/resonance.
 */
export async function getEnvironmentalMatrix(
  userId: string | Types.ObjectId
): Promise<EnvironmentalMatrixItem[]> {
  const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const pipeline = [
    // Stage 1: Scope to user — hits idx_user_env_location_noise
    { $match: { userId: userObjectId } },

    // Stage 2: Group by the three environmental dimensions
    {
      $group: {
        _id: {
          location: "$environment.location",
          lighting: "$environment.lighting",
          noiseLevel: "$environment.noiseLevel",
        },
        sessionCount: { $sum: 1 },
        totalMinutes: { $sum: "$durationMinutes" },
        avgFocus: { $avg: "$experience.focusScore" },
        avgEnergy: { $avg: "$experience.energyScore" },
        avgResonance: { $avg: "$resonanceScore" },
      },
    },

    // Stage 3: Require at least 2 sessions to prevent single-outlier skew
    { $match: { sessionCount: { $gte: 2 } } },

    // Stage 4: Reshape into flat response object
    {
      $project: {
        _id: 0,
        location: "$_id.location",
        lighting: "$_id.lighting",
        noiseLevel: "$_id.noiseLevel",
        sessionCount: 1,
        totalMinutes: 1,
        avgFocus: { $round: ["$avgFocus", 2] },
        avgEnergy: { $round: ["$avgEnergy", 2] },
        avgResonance: { $round: ["$avgResonance", 2] },
      },
    },

    // Stage 5: Best-performing conditions first
    { $sort: { avgResonance: -1 as const, sessionCount: -1 as const } },

    // Stage 6: Limit to top 20
    { $limit: 20 },
  ];

  const results = await Moment.aggregate<EnvironmentalMatrixItem>(pipeline);
  return results;
}

/**
 * Pipeline 2: Time-of-Day Focus Distribution
 * Endpoint: GET /api/analytics/chronobiology?tz=<iana_tz>
 * Shows which hours of the day correlate with highest focus in the user's local timezone.
 */
export async function getChronobiologyDistribution(
  userId: string | Types.ObjectId,
  timezone: string
): Promise<ChronobiologyItem[]> {
  const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const pipeline = [
    // Stage 1: Scope to user — hits idx_user_timeline
    { $match: { userId: userObjectId } },

    // Stage 2: Extract local hour from UTC timestamp using user's IANA timezone
    {
      $project: {
        localHour: { $hour: { date: "$timestamp", timezone: timezone } },
        focusScore: "$experience.focusScore",
        energyScore: "$experience.energyScore",
        durationMinutes: 1,
      },
    },

    // Stage 3: Aggregate by local hour (0–23)
    {
      $group: {
        _id: "$localHour",
        momentCount: { $sum: 1 },
        totalDuration: { $sum: "$durationMinutes" },
        avgFocus: { $avg: "$focusScore" },
        avgEnergy: { $avg: "$energyScore" },
      },
    },

    // Stage 4: Reshape
    {
      $project: {
        _id: 0,
        hour: "$_id",
        momentCount: 1,
        totalDuration: 1,
        avgFocus: { $round: ["$avgFocus", 2] },
        avgEnergy: { $round: ["$avgEnergy", 2] },
      },
    },

    // Stage 5: Sort hour ascending
    { $sort: { hour: 1 as const } },
  ];

  const results = await Moment.aggregate<ChronobiologyItem>(pipeline);
  return results;
}

/**
 * Pipeline 3: Distraction Impact Analysis
 * Endpoint: GET /api/analytics/distractions
 * Quantifies how each distraction tag correlates with lower focus vs overall baseline.
 */
export async function getDistractionImpact(
  userId: string | Types.ObjectId
): Promise<DistractionImpactItem[]> {
  const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const pipeline = [
    // Stage 1: Scope to user — hits idx_user_distractions_multikey
    { $match: { userId: userObjectId } },

    // Stage 2: Run two parallel branches via $facet
    {
      $facet: {
        // Branch A: overall baseline focus across ALL sessions
        baseline: [
          {
            $group: {
              _id: null,
              baselineAvgFocus: { $avg: "$experience.focusScore" },
              totalSessions: { $sum: 1 },
            },
          },
        ],
        // Branch B: per-distraction-tag average focus
        byDistraction: [
          // Only sessions that had at least one distraction logged
          { $match: { "experience.distractions": { $exists: true, $not: { $size: 0 } } } },
          // Decompose array — one document per distraction element
          { $unwind: "$experience.distractions" },
          {
            $group: {
              _id: "$experience.distractions",
              occurrences: { $sum: 1 },
              avgFocusWhenPresent: { $avg: "$experience.focusScore" },
            },
          },
          // Require >= 2 occurrences
          { $match: { occurrences: { $gte: 2 } } },
          { $sort: { occurrences: -1 as const } },
        ],
      },
    },

    // Stage 3: Extract first element from baseline array
    {
      $project: {
        baseline: { $arrayElemAt: ["$baseline", 0] },
        byDistraction: 1,
      },
    },

    // Stage 4: Expand byDistraction rows
    { $unwind: "$byDistraction" },

    // Stage 5: Compute focus delta vs baseline
    {
      $project: {
        _id: 0,
        distraction: "$byDistraction._id",
        occurrences: "$byDistraction.occurrences",
        avgFocus: { $round: ["$byDistraction.avgFocusWhenPresent", 2] },
        baselineFocus: { $round: ["$baseline.baselineAvgFocus", 2] },
        totalSessions: "$baseline.totalSessions",
        focusDelta: {
          $round: [
            { $subtract: ["$byDistraction.avgFocusWhenPresent", "$baseline.baselineAvgFocus"] },
            2,
          ],
        },
      },
    },

    // Stage 6: Most focus-reducing distractions first (most negative focusDelta first)
    { $sort: { focusDelta: 1 as const } },
  ];

  const results = await Moment.aggregate<DistractionImpactItem>(pipeline);
  return results;
}

/**
 * Pipeline 4: Dashboard 7-Day Pulse
 * Endpoint: GET /api/analytics/pulse?tz=<iana_tz>
 * All dashboard KPIs in one round-trip, strictly scoped to previous 7 days.
 */
export async function getSevenDayPulse(
  userId: string | Types.ObjectId,
  timezone: string
): Promise<SevenDayPulseResult> {
  const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  // Computed strictly server-side
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  interface RawPulseFacet {
    weekStats: {
      _id: null;
      sessionCount: number;
      totalLoggedMinutes: number;
      avgFocus: number;
      avgEnergy: number;
      avgResonance: number;
    } | null;
    topLocation: {
      _id: string;
      avgResonance: number;
      count: number;
    } | null;
    dailyTrend: Array<{
      _id: string;
      avgFocus: number;
      avgEnergy: number;
      sessions: number;
    }>;
  }

  const pipeline = [
    // Stage 1: MANDATORY 7-day window — uses range portion of idx_user_timeline
    {
      $match: {
        userId: userObjectId,
        timestamp: { $gte: sevenDaysAgo },
      },
    },

    // Stage 2: Three parallel branches via $facet
    {
      $facet: {
        weekStats: [
          {
            $group: {
              _id: null,
              sessionCount: { $sum: 1 },
              totalLoggedMinutes: { $sum: "$durationMinutes" },
              avgFocus: { $avg: "$experience.focusScore" },
              avgEnergy: { $avg: "$experience.energyScore" },
              avgResonance: { $avg: "$resonanceScore" },
            },
          },
        ],
        topLocation: [
          {
            $group: {
              _id: "$environment.location",
              avgResonance: { $avg: "$resonanceScore" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gte: 2 } } },
          { $sort: { avgResonance: -1 as const } },
          { $limit: 1 },
        ],
        dailyTrend: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$timestamp",
                  timezone: timezone,
                },
              },
              avgFocus: { $avg: "$experience.focusScore" },
              avgEnergy: { $avg: "$experience.energyScore" },
              sessions: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 as const } },
        ],
      },
    },

    // Stage 3: Unwrap single-element arrays from $facet branches
    {
      $project: {
        weekStats: { $arrayElemAt: ["$weekStats", 0] },
        topLocation: { $arrayElemAt: ["$topLocation", 0] },
        dailyTrend: 1,
      },
    },
  ];

  const [raw] = await Moment.aggregate<RawPulseFacet>(pipeline);

  if (!raw) {
    return {
      weekStats: null,
      topLocation: null,
      dailyTrend: [],
    };
  }

  const round2 = (val: number | undefined | null) =>
    val != null && !isNaN(val) ? Math.round(val * 100) / 100 : 0;

  const weekStats: PulseWeekStats | null = raw.weekStats
    ? {
        sessionCount: raw.weekStats.sessionCount,
        totalLoggedMinutes: raw.weekStats.totalLoggedMinutes,
        avgFocus: round2(raw.weekStats.avgFocus),
        avgEnergy: round2(raw.weekStats.avgEnergy),
        avgResonance: round2(raw.weekStats.avgResonance),
      }
    : null;

  const topLocation: PulseTopLocation | null = raw.topLocation
    ? {
        location: raw.topLocation._id,
        avgResonance: round2(raw.topLocation.avgResonance),
        count: raw.topLocation.count,
      }
    : null;

  const dailyTrend: PulseDailyTrendItem[] = (raw.dailyTrend ?? []).map((d) => ({
    date: d._id,
    avgFocus: round2(d.avgFocus),
    avgEnergy: round2(d.avgEnergy),
    sessions: d.sessions,
  }));

  return {
    weekStats,
    topLocation,
    dailyTrend,
  };
}

/**
 * Analytics Summary
 * Endpoint: GET /api/analytics/summary
 * Returns all-time aggregate statistics across all recorded moments for the user.
 */
export async function getAnalyticsSummary(
  userId: string | Types.ObjectId
): Promise<AnalyticsSummaryResult> {
  const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const pipeline = [
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: null,
        totalMoments: { $sum: 1 },
        totalMinutes: { $sum: "$durationMinutes" },
        avgFocus: { $avg: "$experience.focusScore" },
        avgEnergy: { $avg: "$experience.energyScore" },
        avgResonance: { $avg: "$resonanceScore" },
      },
    },
    {
      $project: {
        _id: 0,
        totalMoments: 1,
        totalMinutes: 1,
        avgFocus: { $round: ["$avgFocus", 2] },
        avgEnergy: { $round: ["$avgEnergy", 2] },
        avgResonance: { $round: ["$avgResonance", 2] },
      },
    },
  ];

  const [result] = await Moment.aggregate<AnalyticsSummaryResult>(pipeline);

  return (
    result ?? {
      totalMoments: 0,
      totalMinutes: 0,
      avgFocus: 0,
      avgEnergy: 0,
      avgResonance: 0,
    }
  );
}
