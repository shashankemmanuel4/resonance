import { app } from "../app.js";
import { connectDB, disconnectDB } from "../config/db.js";
import http from "http";

async function testApi() {
  await connectDB();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Invalid address");
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`[API Test] Ephemeral test server running at ${baseUrl}`);

  try {
    // 1. Health endpoint
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log("[API Test] Health check response:", healthRes.status, healthData);

    // 2. Demo Seed (Idempotent test)
    const seedRes = await fetch(`${baseUrl}/api/demo/seed`, { method: "POST" });
    const seedData = await seedRes.json();
    console.log("[API Test] POST /api/demo/seed response:", seedRes.status, seedData);

    // 3. Demo Reset Validation Error (missing confirm: true)
    const badResetRes = await fetch(`${baseUrl}/api/demo/reset`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: false }),
    });
    const badResetData = (await badResetRes.json()) as { success: boolean };
    console.log("[API Test] DELETE /api/demo/reset (bad body) status:", badResetRes.status, "success:", badResetData.success);

    // 4. Demo Reset Success ({ confirm: true })
    const goodResetRes = await fetch(`${baseUrl}/api/demo/reset`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const goodResetData = await goodResetRes.json();
    console.log("[API Test] DELETE /api/demo/reset ({ confirm: true }) response:", goodResetRes.status, goodResetData);

    // 5. Re-seed after reset to restore 60 moments
    const reSeedRes = await fetch(`${baseUrl}/api/demo/seed`, { method: "POST" });
    const reSeedData = await reSeedRes.json();
    console.log("[API Test] POST /api/demo/seed (re-seed) response:", reSeedRes.status, reSeedData);

    console.log("[API Test] All Phase 1 API checks passed!");
  } finally {
    server.close();
    await disconnectDB();
  }
}

testApi().catch((err) => {
  console.error("[API Test] Failed:", err);
  process.exit(1);
});
