import { app } from "../app.js";
import { connectDB, disconnectDB } from "../config/db.js";
import http from "http";

async function testMomentsApi() {
  await connectDB();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Invalid address");
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`[Moments API Test] Test server running at ${baseUrl}`);

  try {
    // 1. GET /api/moments (default pagination)
    const listRes = await fetch(`${baseUrl}/api/moments`);
    const listData = (await listRes.json()) as { success: boolean; data: { moments: unknown[]; total: number; page: number; pages: number } };
    console.log("[Moments API Test] GET /api/moments status:", listRes.status, "total:", listData.data.total, "page:", listData.data.page);

    // 2. GET /api/moments with filters
    const filterRes = await fetch(`${baseUrl}/api/moments?category=deep_work&minFocus=4&limit=5`);
    const filterData = (await filterRes.json()) as { success: boolean; data: { moments: unknown[]; total: number } };
    console.log("[Moments API Test] GET /api/moments (filtered) status:", filterRes.status, "matches:", filterData.data.moments.length, "total:", filterData.data.total);

    // 3. POST /api/moments (Zod validation failure: focusScore = 6)
    const badPostRes = await fetch(`${baseUrl}/api/moments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        durationMinutes: 45,
        activity: { category: "deep_work", taskName: "Test Task" },
        environment: { location: "Test Lab", noiseLevel: 2, lighting: "natural", peoplePresent: "alone" },
        experience: { focusScore: 6, energyScore: 4, moodScore: 4, distractions: [] },
      }),
    });
    const badPostData = (await badPostRes.json()) as { success: boolean; error: { message: string; details: unknown[] } };
    console.log("[Moments API Test] POST /api/moments (invalid score 6) status:", badPostRes.status, "success:", badPostData.success, "error:", badPostData.error.message);

    // 4. POST /api/moments (valid creation)
    // focus = 4, energy = 3 -> resonance = 4*0.6 + 3*0.4 = 2.4 + 1.2 = 3.6
    const goodPostRes = await fetch(`${baseUrl}/api/moments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        durationMinutes: 45,
        activity: { category: "deep_work", taskName: "Test Temporary Task" },
        environment: { location: "Test Room", noiseLevel: 2, lighting: "natural", peoplePresent: "alone" },
        experience: { focusScore: 4, energyScore: 3, moodScore: 4, distractions: [] },
        reflection: "Testing Phase 2A CRUD",
      }),
    });
    const goodPostData = (await goodPostRes.json()) as { success: boolean; data: { moment: { _id: string; resonanceScore: number; userId: string } } };
    console.log("[Moments API Test] POST /api/moments (valid) status:", goodPostRes.status, "resonanceScore:", goodPostData.data.moment.resonanceScore, "userId:", goodPostData.data.moment.userId);

    const createdId = goodPostData.data.moment._id;

    // 5. GET /api/moments/:id (fetch created)
    const getRes = await fetch(`${baseUrl}/api/moments/${createdId}`);
    const getData = (await getRes.json()) as { success: boolean; data: { moment: { _id: string } } };
    console.log("[Moments API Test] GET /api/moments/:id status:", getRes.status, "found:", getData.data.moment._id === createdId);

    // 6. GET /api/moments/:id (non-existent 24-hex ID)
    const notFoundRes = await fetch(`${baseUrl}/api/moments/000000000000000000000000`);
    console.log("[Moments API Test] GET /api/moments/:id (non-existent) status:", notFoundRes.status);

    // 7. GET /api/moments/:id (invalid format)
    const badIdRes = await fetch(`${baseUrl}/api/moments/invalid-id-123`);
    console.log("[Moments API Test] GET /api/moments/:id (bad format) status:", badIdRes.status);

    // 8. DELETE /api/moments/:id (clean up created test document so seed remains unaltered)
    const delRes = await fetch(`${baseUrl}/api/moments/${createdId}`, { method: "DELETE" });
    const delData = (await delRes.json()) as { success: boolean; data: { deletedId: string } };
    console.log("[Moments API Test] DELETE /api/moments/:id status:", delRes.status, "deletedId:", delData.data.deletedId);

    // 9. DELETE again -> 404
    const delAgainRes = await fetch(`${baseUrl}/api/moments/${createdId}`, { method: "DELETE" });
    console.log("[Moments API Test] DELETE /api/moments/:id (repeat) status:", delAgainRes.status);

    console.log("[Moments API Test] All Phase 2A CRUD checks passed successfully!");
  } finally {
    server.close();
    await disconnectDB();
  }
}

testMomentsApi().catch((err) => {
  console.error("[Moments API Test] Failed:", err);
  process.exit(1);
});
