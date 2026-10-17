import { connectDB, disconnectDB } from "../config/db.js";
import { seedDatabase } from "./seedData.js";

async function main() {
  console.log("[Seed CLI] Connecting to database...");
  await connectDB();
  console.log("[Seed CLI] Seeding curated academic moments...");
  const result = await seedDatabase();
  console.log(`[Seed CLI] ${result.message} (inserted: ${result.insertedCount})`);
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error("[Seed CLI] Fatal error:", err);
  process.exit(1);
});
