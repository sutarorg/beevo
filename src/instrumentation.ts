/**
 * Next.js instrumentation hook — runs once when the server boots.
 *
 * On Vercel, cron is driven by `vercel.json` (daily on Hobby) plus the
 * external 5-minute pinger (GitHub Action / cron-job.org) documented in
 * the README. Under any other long-lived Node runtime (`npm start`,
 * Docker, a VM), an internal loop keeps the publishing engine on time
 * with zero external wiring.
 *
 * Disable with: ENABLE_INTERNAL_CRON=false
 * Interval:     INTERNAL_CRON_INTERVAL_MS (default 60000)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VERCEL) return; // Vercel: external cron handles it
  if (process.env.ENABLE_INTERNAL_CRON === "false") return;

  const g = globalThis as typeof globalThis & {
    __beevoCronTimer?: ReturnType<typeof setInterval>;
  };
  if (g.__beevoCronTimer) return; // hot-reload dedupe

  const intervalMs = Number(process.env.INTERNAL_CRON_INTERVAL_MS ?? "60000") || 60000;
  let syncRunning = false;
  let lastSyncDay = "";

  const tick = async () => {
    try {
      const { publishDuePosts } = await import("@/lib/server/jobs/publisher");
      const summary = await publishDuePosts(50);
      if (summary.processed > 0) {
        console.log(
          `[beevo cron] processed=${summary.processed} published=${summary.targetsPublished} failed=${summary.targetsFailed}`
        );
      }
    } catch (err) {
      console.error("[beevo cron] publisher tick failed:", err);
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      // Nightly analytics sync (first tick at/after 03:00 UTC).
      if (!syncRunning && lastSyncDay !== today && new Date().getUTCHours() >= 3) {
        syncRunning = true;
        const { syncAnalytics } = await import("@/lib/server/jobs/sync-analytics");
        await syncAnalytics();
        lastSyncDay = today;
      }
    } catch (err) {
      console.error("[beevo cron] analytics sync failed:", err);
    } finally {
      syncRunning = false;
    }
  };

  g.__beevoCronTimer = setInterval(tick, intervalMs);
  setTimeout(tick, 5000); // first sweep shortly after boot
  console.log(`[beevo cron] internal scheduler started (every ${intervalMs / 1000}s)`);
}
