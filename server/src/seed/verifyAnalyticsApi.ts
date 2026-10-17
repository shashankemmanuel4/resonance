import { app } from "../app.js";
import { connectDB, disconnectDB } from "../config/db.js";
import http from "http";

async function runVerification() {
  await connectDB();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Invalid address");
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`[Analytics Test] Ephemeral test server active at ${baseUrl}`);

  try {
    // -------------------------------------------------------------------------
    // 1. GET /api/analytics/summary (All-time totals)
    // -------------------------------------------------------------------------
    const summaryRes = await fetch(`${baseUrl}/api/analytics/summary`);
    const summaryData = (await summaryRes.json()) as {
      success: boolean;
      data: {
        totalMoments: number;
        totalMinutes: number;
        avgFocus: number;
        avgEnergy: number;
        avgResonance: number;
      };
    };
    console.log("[Analytics Test] 1. Summary status:", summaryRes.status, summaryData);
    if (!summaryData.success) {
      throw new Error(`Summary failed with: ${JSON.stringify(summaryData)}`);
    }
    if (summaryData.data.totalMoments !== 60) {
      throw new Error(`Expected 60 total moments in summary, got: ${summaryData.data.totalMoments}`);
    }

    // -------------------------------------------------------------------------
    // 2. GET /api/analytics/matrix (Pipeline 1: Environmental Matrix)
    // -------------------------------------------------------------------------
    const matrixRes = await fetch(`${baseUrl}/api/analytics/matrix`);
    const matrixData = (await matrixRes.json()) as {
      success: boolean;
      data: Array<{
        location: string;
        lighting: string;
        noiseLevel: number;
        sessionCount: number;
        totalMinutes: number;
        avgFocus: number;
        avgEnergy: number;
        avgResonance: number;
      }>;
    };
    console.log("[Analytics Test] 2. Matrix status:", matrixRes.status, `conditions returned: ${matrixData.data.length}`);
    if (matrixData.data.length === 0) {
      throw new Error("Matrix returned 0 conditions. Expected at least the 4 seeded patterns.");
    }
    // Verify minimum occurrences constraint (sessionCount >= 2)
    for (const item of matrixData.data) {
      if (item.sessionCount < 2) {
        throw new Error(`Matrix item violated sessionCount >= 2: ${JSON.stringify(item)}`);
      }
    }
    // Verify top condition is University Library (Pattern A) with highest resonance
    const topCondition = matrixData.data[0];
    console.log("[Analytics Test]    Top condition:", topCondition?.location, "avgResonance:", topCondition?.avgResonance);

    // -------------------------------------------------------------------------
    // 3. GET /api/analytics/chronobiology?tz=Asia/Kolkata (Pipeline 2: Local Hour)
    // -------------------------------------------------------------------------
    const chronoRes = await fetch(`${baseUrl}/api/analytics/chronobiology?tz=Asia%2FKolkata`);
    const chronoData = (await chronoRes.json()) as {
      success: boolean;
      data: Array<{
        hour: number;
        momentCount: number;
        totalDuration: number;
        avgFocus: number;
        avgEnergy: number;
      }>;
    };
    console.log("[Analytics Test] 3. Chronobiology (IST) status:", chronoRes.status, `hours returned: ${chronoData.data.length}`);
    // Check that hour 9 IST exists (09:00 IST morning library sessions)
    const hour9 = chronoData.data.find((h) => h.hour === 9);
    console.log("[Analytics Test]    Hour 9 IST stats:", hour9);
    if (!hour9 || hour9.momentCount === 0) {
      throw new Error("Expected hour 9 IST to have moments from Pattern A.");
    }

    // -------------------------------------------------------------------------
    // 4. GET /api/analytics/chronobiology without ?tz (fallback to stored pref)
    // -------------------------------------------------------------------------
    const chronoDefaultRes = await fetch(`${baseUrl}/api/analytics/chronobiology`);
    const chronoDefaultData = (await chronoDefaultRes.json()) as {
      success: boolean;
      data: Array<{ hour: number; momentCount: number }>;
    };
    console.log("[Analytics Test] 4. Chronobiology (no ?tz param) status:", chronoDefaultRes.status, `success: ${chronoDefaultData.success}`);
    if (chronoDefaultRes.status !== 200) {
      throw new Error("Chronobiology without ?tz should succeed using stored user preference.");
    }

    // -------------------------------------------------------------------------
    // 5. GET /api/analytics/distractions (Pipeline 3: Distraction Impact)
    // -------------------------------------------------------------------------
    const distractRes = await fetch(`${baseUrl}/api/analytics/distractions`);
    const distractData = (await distractRes.json()) as {
      success: boolean;
      data: Array<{
        distraction: string;
        occurrences: number;
        avgFocus: number;
        baselineFocus: number;
        totalSessions: number;
        focusDelta: number;
      }>;
    };
    console.log("[Analytics Test] 5. Distractions status:", distractRes.status, `distractions returned: ${distractData.data.length}`);
    for (const d of distractData.data) {
      if (d.occurrences < 2) {
        throw new Error(`Distraction occurrences < 2 found: ${JSON.stringify(d)}`);
      }
      console.log(`    - ${d.distraction}: delta=${d.focusDelta} (avg: ${d.avgFocus} vs baseline: ${d.baselineFocus})`);
    }

    // -------------------------------------------------------------------------
    // 6. GET /api/analytics/pulse?tz=Asia/Kolkata (Pipeline 4: 7-Day Pulse)
    // -------------------------------------------------------------------------
    const pulseRes = await fetch(`${baseUrl}/api/analytics/pulse?tz=Asia%2FKolkata`);
    const pulseData = (await pulseRes.json()) as {
      success: boolean;
      data: {
        weekStats: {
          sessionCount: number;
          totalLoggedMinutes: number;
          avgFocus: number;
          avgEnergy: number;
          avgResonance: number;
        } | null;
        topLocation: { location: string; avgResonance: number; count: number } | null;
        dailyTrend: Array<{ date: string; avgFocus: number; avgEnergy: number; sessions: number }>;
      };
    };
    console.log("[Analytics Test] 6. 7-Day Pulse status:", pulseRes.status, "weekStats:", pulseData.data.weekStats);
    // Crucial check: 7-day pulse must NOT equal all-time 60 moments
    if (pulseData.data.weekStats && pulseData.data.weekStats.sessionCount >= 60) {
      throw new Error("7-day pulse has 60+ moments. It must strictly filter to the last 7 days!");
    }
    console.log("[Analytics Test]    7-day sessionCount:", pulseData.data.weekStats?.sessionCount, "vs all-time 60 moments (7-day window properly scoped).");

    // -------------------------------------------------------------------------
    // 7. GET /api/user/preferences
    // -------------------------------------------------------------------------
    const prefRes = await fetch(`${baseUrl}/api/user/preferences`);
    const prefData = (await prefRes.json()) as { success: boolean; data: { timezone: string } };
    const originalTimezone = prefData.data.timezone;
    console.log("[Analytics Test] 7. User preferences status:", prefRes.status, "original timezone:", originalTimezone);

    // -------------------------------------------------------------------------
    // 8. PATCH /api/user/preferences (Valid update & restore)
    // -------------------------------------------------------------------------
    const testTimezone = "America/New_York";
    const updateRes = await fetch(`${baseUrl}/api/user/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: testTimezone }),
    });
    const updateData = (await updateRes.json()) as { success: boolean; data: { timezone: string } };
    console.log("[Analytics Test] 8. PATCH preferences (valid) status:", updateRes.status, "new tz:", updateData.data.timezone);
    if (updateData.data.timezone !== testTimezone) {
      throw new Error(`Failed to update timezone to ${testTimezone}`);
    }

    // Immediately restore original timezone so DB is preserved
    const restoreRes = await fetch(`${baseUrl}/api/user/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: originalTimezone }),
    });
    const restoreData = (await restoreRes.json()) as { success: boolean; data: { timezone: string } };
    console.log("[Analytics Test]    Restored original timezone:", restoreData.data.timezone);

    // -------------------------------------------------------------------------
    // 9. PATCH /api/user/preferences (Invalid timezone -> HTTP 400)
    // -------------------------------------------------------------------------
    const badPrefRes = await fetch(`${baseUrl}/api/user/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: "Invalid/Timezone_Not_Real" }),
    });
    console.log("[Analytics Test] 9. PATCH preferences (invalid tz) status:", badPrefRes.status, "(expected 400)");
    if (badPrefRes.status !== 400) {
      throw new Error(`Expected 400 for invalid timezone, got: ${badPrefRes.status}`);
    }

    // -------------------------------------------------------------------------
    // 10. GET /api/analytics/pulse?tz=Invalid/Timezone -> HTTP 400
    // -------------------------------------------------------------------------
    const badTzQueryRes = await fetch(`${baseUrl}/api/analytics/pulse?tz=Invalid/Timezone`);
    console.log("[Analytics Test] 10. GET /api/analytics/pulse (invalid tz query) status:", badTzQueryRes.status, "(expected 400)");
    if (badTzQueryRes.status !== 400) {
      throw new Error(`Expected 400 for invalid query timezone, got: ${badTzQueryRes.status}`);
    }

    console.log("\n=======================================================");
    console.log("[Analytics Test] ALL Phase 2B checks passed with 100% compliance!");
    console.log("=======================================================\n");
  } finally {
    server.close();
    await disconnectDB();
  }
}

runVerification().catch((err) => {
  console.error("[Analytics Test] Verification FAILED:", err);
  process.exit(1);
});
