import { app } from "./app.js";
import { config } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";

async function startServer(): Promise<void> {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`[Server] RESONANCE backend listening on port ${config.port} (env: ${config.nodeEnv})`);
      console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
    });

    const shutdown = async () => {
      console.log("\n[Server] Shutting down gracefully...");
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("[Server] Fatal error during startup:", error);
    process.exit(1);
  }
}

void startServer();
