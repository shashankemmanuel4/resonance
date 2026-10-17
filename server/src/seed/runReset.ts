import { connectDB, disconnectDB } from "../config/db.js";
import { resetDatabase } from "./seedData.js";

async function main() {
  console.log("[Reset CLI] Connecting to database...");
  await connectDB();
  console.log("[Reset CLI] Resetting all moments for demo user...");
  const result = await resetDatabase();
  console.log(`[Reset CLI] Reset complete. Deleted ${result.deletedCount} moments.`);
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error("[Reset CLI] Fatal error:", err);
  process.exit(1);
});
