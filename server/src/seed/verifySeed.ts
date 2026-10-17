import mongoose, { Types } from "mongoose";
import { config } from "../config/env.js";
import { Moment } from "../models/Moment.js";
import { User } from "../models/User.js";
import { seedDatabase } from "./seedData.js";

async function verify() {
  await mongoose.connect(config.mongoUri);
  console.log("[Verification] Connected to MongoDB.");

  // 1. Verify User
  const demoUserId = new Types.ObjectId(config.demoUserId);
  const user = await User.findById(demoUserId);
  console.log("[Verification] Demo User:", user ? { _id: user._id.toString(), name: user.name, timezone: user.preferences.timezone } : "NOT FOUND");

  // 2. Verify Moment count
  const momentCount = await Moment.countDocuments({ userId: demoUserId });
  console.log(`[Verification] Total moments for demo user: ${momentCount} (Expected: 60)`);

  // 3. Verify Indexes
  const rawIndexes = await Moment.collection.indexes();
  console.log("[Verification] Moment indexes in collection:");
  for (const idx of rawIndexes) {
    console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
  }

  // 4. Verify Pattern counts
  const patternA = await Moment.countDocuments({ userId: demoUserId, "environment.location": "University Library" });
  const patternB = await Moment.countDocuments({ userId: demoUserId, "environment.location": "Science Cafe" });
  const patternC = await Moment.countDocuments({ userId: demoUserId, "environment.location": "Home Studio" });
  const patternD = await Moment.countDocuments({ userId: demoUserId, "environment.location": "Open Lab" });
  console.log(`[Verification] Pattern counts: Library=${patternA} (exp 20), Cafe=${patternB} (exp 15), Home=${patternC} (exp 15), Lab=${patternD} (exp 10)`);

  // 5. Verify sample moment timestamp and resonanceScore
  const sample = await Moment.findOne({ userId: demoUserId, "environment.location": "University Library" });
  if (sample) {
    const expectedResonance = Math.round(((sample.experience.focusScore * 0.6) + (sample.experience.energyScore * 0.4)) * 10) / 10;
    console.log("[Verification] Sample Pattern A moment:", {
      timestamp: sample.timestamp.toISOString(),
      duration: sample.durationMinutes,
      focus: sample.experience.focusScore,
      energy: sample.experience.energyScore,
      resonanceScore: sample.resonanceScore,
      expectedResonance,
      match: sample.resonanceScore === expectedResonance,
    });
  }

  // 6. Test Idempotency
  const idempotentResult = await seedDatabase(config.demoUserId);
  console.log("[Verification] Idempotency re-run result:", idempotentResult);

  await mongoose.disconnect();
}

verify().catch((err) => {
  console.error("[Verification] Failed:", err);
  process.exit(1);
});
