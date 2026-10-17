import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export interface AppConfig {
  port: number;
  mongoUri: string;
  demoUserId: string;
  defaultTimezone: string;
  nodeEnv: string;
}

const mongoUri = process.env["MONGODB_URI"] ?? "mongodb://127.0.0.1:27017/resonance";
const portRaw = process.env["PORT"] ?? "5000";
const demoUserId = process.env["DEMO_USER_ID"] ?? "66f00100a12b3c4d5e6f0001";
const defaultTimezone = process.env["DEFAULT_TIMEZONE"] ?? "Asia/Kolkata";
const nodeEnv = process.env["NODE_ENV"] ?? "development";

export const config: AppConfig = {
  port: parseInt(portRaw, 10) || 5000,
  mongoUri,
  demoUserId,
  defaultTimezone,
  nodeEnv,
};
