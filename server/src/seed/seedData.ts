import { Types } from "mongoose";
import { Moment, IMoment } from "../models/Moment.js";
import { config } from "../config/env.js";
import { ensureDemoUser } from "../config/db.js";

interface SeedPatternDef {
  type: "A" | "B" | "C" | "D";
  category: "deep_work" | "shallow_work" | "creative" | "learning" | "rest" | "communication";
  taskNames: string[];
  location: string;
  noiseLevel: number;
  lighting: "natural" | "dim" | "bright" | "fluorescent";
  peoplePresent: "alone" | "parallel_work" | "crowded" | "meeting";
  focusScore: number;
  energyScore: number;
  moodScore: number;
  distractions: string[];
  reflections: string[];
  istHour: number;
  istMinute: number;
  durationMinutes: number;
}

const PATTERN_A: SeedPatternDef = {
  type: "A",
  category: "deep_work",
  taskNames: [
    "Distributed Systems Literature Review",
    "Database Indexing Optimization Analysis",
    "Algorithm Design Proofs",
    "Core Architecture Documentation",
    "Compiler Design Theory Research",
  ],
  location: "University Library",
  noiseLevel: 1,
  lighting: "natural",
  peoplePresent: "alone",
  focusScore: 5,
  energyScore: 4,
  moodScore: 4,
  distractions: [],
  reflections: [
    "Quiet environment with natural morning lighting allowed sustained concentration.",
    "Excellent deep work session. Silent desks by the window are optimal.",
    "Zero interruptions. High cognitive clarity throughout the entire morning block.",
    "Natural light and low acoustics made problem-solving feel effortless.",
  ],
  istHour: 9,
  istMinute: 0,
  durationMinutes: 90,
};

const PATTERN_B: SeedPatternDef = {
  type: "B",
  category: "shallow_work",
  taskNames: [
    "Replying to Department Emails & Coordination",
    "Administrative Forms & Project Submissions",
    "Reviewing Meeting Transcripts",
    "Organizing Shared Reference Folders",
    "Sorting Academic Seminar Schedules",
  ],
  location: "Science Cafe",
  noiseLevel: 4,
  lighting: "fluorescent",
  peoplePresent: "crowded",
  focusScore: 2,
  energyScore: 2,
  moodScore: 3,
  distractions: ["Phone", "Interruptions"],
  reflections: [
    "Loud conversation and espresso machine noise made it hard to stay on track.",
    "Frequent phone alerts and background chatter broke continuity.",
    "Afternoon fatigue combined with cafe bustle slowed down progress.",
    "Struggled with focus; suited only for light admin tasks.",
  ],
  istHour: 14,
  istMinute: 30,
  durationMinutes: 45,
};

const PATTERN_C: SeedPatternDef = {
  type: "C",
  category: "creative",
  taskNames: [
    "Interface Wireframe Explorations",
    "Typography & Layout Sketching",
    "Academic Presentation Slide Drafting",
    "Data Visualisation Prototyping",
    "User Flow Journey Mapping",
  ],
  location: "Home Studio",
  noiseLevel: 2,
  lighting: "dim",
  peoplePresent: "alone",
  focusScore: 4,
  energyScore: 3,
  moodScore: 4,
  distractions: ["Fatigue"],
  reflections: [
    "Quiet evening solitude with warm desk lamp. Creative ideation flowed well.",
    "Slight physical tiredness towards the end, but mental focus remained steady.",
    "Relaxed atmosphere; good output on UI component layouts.",
    "Dim ambient light reduced screen strain during late drafting.",
  ],
  istHour: 20,
  istMinute: 30,
  durationMinutes: 60,
};

const PATTERN_D: SeedPatternDef = {
  type: "D",
  category: "shallow_work",
  taskNames: [
    "Team Sync & Code Repository Triage",
    "Lab Equipment Calibration Logs",
    "Debugging Shared CI/CD Pipeline",
    "Peer Reviewing Pull Requests",
    "Answering Lab Discussion Boards",
  ],
  location: "Open Lab",
  noiseLevel: 4,
  lighting: "bright",
  peoplePresent: "parallel_work",
  focusScore: 2,
  energyScore: 3,
  moodScore: 3,
  distractions: ["Background Noise", "Messaging Apps"],
  reflections: [
    "Colleagues speaking nearby and continuous Slack alerts disrupted thinking.",
    "Constant movement and chatter made deep technical tasks impossible.",
    "Bright overhead lighting felt clinical and fatiguing over two hours.",
    "High distraction frequency caused repeated context switching.",
  ],
  istHour: 11,
  istMinute: 30,
  durationMinutes: 60,
};

/**
 * Converts IST (Asia/Kolkata, UTC+05:30) date parts to a standard UTC Date.
 * Formula: UTC time = IST time - 5 hours 30 minutes.
 */
function istToUtcDate(year: number, monthIndex: number, day: number, istHour: number, istMinute: number): Date {
  const istOffsetMinutes = 5 * 60 + 30; // 330 minutes
  const totalIstMinutes = istHour * 60 + istMinute;
  const utcTotalMinutes = totalIstMinutes - istOffsetMinutes;

  const utcDate = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
  utcDate.setUTCMinutes(utcTotalMinutes);
  return utcDate;
}

export function generateSeedMoments(userId: Types.ObjectId, referenceDate = new Date()): Partial<IMoment>[] {
  const moments: Partial<IMoment>[] = [];

  // Distribution schedule across 30 days:
  // Total: 20 Pattern A, 15 Pattern B, 15 Pattern C, 10 Pattern D = exactly 60 moments.
  const schedule: [SeedPatternDef, SeedPatternDef][] = [];

  // 10 days of A + D (10 A, 10 D)
  for (let i = 0; i < 10; i++) {
    schedule.push([PATTERN_A, PATTERN_D]);
  }
  // 10 days of A + B (10 A, 10 B)
  for (let i = 0; i < 10; i++) {
    schedule.push([PATTERN_A, PATTERN_B]);
  }
  // 5 days of B + C (5 B, 5 C)
  for (let i = 0; i < 5; i++) {
    schedule.push([PATTERN_B, PATTERN_C]);
  }
  // 5 days of C + C-variant (10 C)
  for (let i = 0; i < 5; i++) {
    schedule.push([PATTERN_C, PATTERN_C]);
  }

  // Generate for 30 consecutive days up to referenceDate
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - 29); // 30 days total (day 0 to day 29)

  for (let dayIndex = 0; dayIndex < 30; dayIndex++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + dayIndex);

    const year = currentDay.getFullYear();
    const month = currentDay.getMonth();
    const day = currentDay.getDate();

    const daySchedule = schedule[dayIndex];
    if (!daySchedule) continue;

    const [firstPattern, secondPattern] = daySchedule;

    // First moment of the day
    const m1 = createMomentFromPattern(userId, firstPattern, year, month, day, false);
    moments.push(m1);

    // Second moment of the day (if same pattern, shift time to avoid duplicate timestamp)
    const isSecondSamePattern = firstPattern.type === secondPattern.type;
    const m2 = createMomentFromPattern(userId, secondPattern, year, month, day, isSecondSamePattern);
    moments.push(m2);
  }

  return moments;
}

function createMomentFromPattern(
  userId: Types.ObjectId,
  pattern: SeedPatternDef,
  year: number,
  month: number,
  day: number,
  timeShift: boolean
): Partial<IMoment> {
  const hour = timeShift ? pattern.istHour + 1 : pattern.istHour;
  const minute = pattern.istMinute;
  const timestamp = istToUtcDate(year, month, day, hour, minute);

  // Slight natural variance per pattern while maintaining strict analytical bounds
  let focus = pattern.focusScore;
  let energy = pattern.energyScore;
  let mood = pattern.moodScore;

  if (pattern.type === "A") {
    // Alternates between 5 and 4 for realistic variation
    focus = day % 3 === 0 ? 4 : 5;
    energy = day % 2 === 0 ? 5 : 4;
  } else if (pattern.type === "B") {
    // Alternates between 2 and 3
    focus = day % 2 === 0 ? 2 : 3;
    energy = day % 3 === 0 ? 3 : 2;
  } else if (pattern.type === "C") {
    // Alternates between 3 and 4
    focus = day % 2 === 0 ? 4 : 3;
    energy = 3;
  } else if (pattern.type === "D") {
    focus = 2;
    energy = 3;
  }

  // Pre-computed resonance score formula: (focus * 0.6) + (energy * 0.4) rounded to 1 decimal place
  const resonanceScore = Math.round(((focus * 0.6) + (energy * 0.4)) * 10) / 10;

  const taskIndex = day % pattern.taskNames.length;
  const taskName = pattern.taskNames[taskIndex] ?? pattern.taskNames[0] ?? "Focused Work";

  const reflectionIndex = day % pattern.reflections.length;
  const reflection = pattern.reflections[reflectionIndex] ?? "";

  return {
    userId,
    timestamp,
    durationMinutes: pattern.durationMinutes,
    activity: {
      category: pattern.category,
      taskName,
    },
    environment: {
      location: pattern.location,
      noiseLevel: pattern.noiseLevel,
      lighting: pattern.lighting,
      peoplePresent: pattern.peoplePresent,
    },
    experience: {
      focusScore: focus,
      energyScore: energy,
      moodScore: mood,
      distractions: [...pattern.distractions],
    },
    reflection,
    resonanceScore,
  };
}

export async function seedDatabase(targetUserId = config.demoUserId): Promise<{ insertedCount: number; message: string }> {
  await ensureDemoUser();

  const userObjectId = new Types.ObjectId(targetUserId);

  // Idempotency check: if moments already exist for this user, do not duplicate
  const existingCount = await Moment.countDocuments({ userId: userObjectId });
  if (existingCount > 0) {
    return {
      insertedCount: 0,
      message: `Data already seeded (${existingCount} moments present for user ${targetUserId}).`,
    };
  }

  const seedDocs = generateSeedMoments(userObjectId);
  const result = await Moment.insertMany(seedDocs);

  return {
    insertedCount: result.length,
    message: `Successfully seeded ${result.length} moments for user ${targetUserId}.`,
  };
}

export async function resetDatabase(targetUserId = config.demoUserId): Promise<{ deletedCount: number }> {
  const userObjectId = new Types.ObjectId(targetUserId);
  const result = await Moment.deleteMany({ userId: userObjectId });
  return {
    deletedCount: result.deletedCount,
  };
}
