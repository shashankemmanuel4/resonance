import mongoose, { Types } from "mongoose";
import { config } from "./env.js";
import { User } from "../models/User.js";
import { Moment } from "../models/Moment.js";

export async function connectDB(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected to database: ${conn.connection.name} at ${conn.connection.host}:${conn.connection.port}`);

    // Sync approved indexes
    await Promise.all([
      User.syncIndexes(),
      Moment.syncIndexes(),
    ]);
    console.log("[MongoDB] Schema indexes verified and synchronized.");

    // Ensure demo user exists
    await ensureDemoUser();

    return conn;
  } catch (error) {
    const err = error as Error;
    console.error("\n=======================================================");
    console.error("[MongoDB] Connection Error!");
    console.error(`Message: ${err.message}`);
    console.error(`Target URI: ${config.mongoUri}`);
    console.error("Please verify that MongoDB is running locally or that your MONGODB_URI in server/.env is correct.");
    console.error("=======================================================\n");
    throw error;
  }
}

export async function ensureDemoUser(): Promise<void> {
  try {
    const demoObjectId = new Types.ObjectId(config.demoUserId);
    const existing = await User.findById(demoObjectId);
    if (!existing) {
      await User.create({
        _id: demoObjectId,
        name: "Demo User",
        preferences: {
          timezone: config.defaultTimezone,
        },
      });
      console.log(`[MongoDB] Demo user initialized with _id: ${config.demoUserId}`);
    }
  } catch (error) {
    console.error("[MongoDB] Error ensuring demo user:", error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log("[MongoDB] Disconnected.");
}
