import http from "node:http";
import os from "node:os";
import {
  executeMediaPipelineStages,
  failGenerationAndReleaseCredits,
  type GenerationJobRow,
} from "../src/features/pipeline/orchestrator";
import { isSupabaseAdminConfigured } from "../src/lib/env";
import { flushPendingEmailOutbox } from "../src/lib/resend/client";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { executeVideoRenderJob } from "./ffmpeg-renderer";

const WORKER_ID = `beevo-worker-${os.hostname()}-${process.pid}`;
const PORT = Number(process.env.PORT ?? 8080);
const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 3000);
const MAX_CONCURRENCY = Math.max(1, Number(process.env.WORKER_CONCURRENCY ?? 2));
const LEASE_SECONDS = 300;

let activeJobs = 0;
let shuttingDown = false;
let processedCount = 0;
let failedCount = 0;

async function processSingleJob(job: GenerationJobRow) {
  const admin = createSupabaseAdminClient();
  const heartbeat = setInterval(() => {
    void admin
      .from("generation_jobs")
      .update({
        heartbeat_at: new Date().toISOString(),
        lease_expires_at: new Date(Date.now() + LEASE_SECONDS * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("worker_id", WORKER_ID);
  }, 60_000);

  try {
    const mediaResult = await executeMediaPipelineStages(admin, job);
    if (!mediaResult.cancelled && mediaResult.timelineId) {
      await executeVideoRenderJob(admin, job, mediaResult.timelineId, WORKER_ID);
    }

    await admin
      .from("generation_jobs")
      .update({
        status: mediaResult.cancelled ? "cancelled" : "completed",
        lease_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    processedCount += 1;
  } catch (err) {
    failedCount += 1;
    const message = err instanceof Error ? err.message : String(err);
    const hasRetriesLeft = job.attempt_count < job.max_attempts;

    if (hasRetriesLeft) {
      const backoffSec = Math.min(300, Math.pow(2, job.attempt_count) * 15);
      await admin
        .from("generation_jobs")
        .update({
          status: "queued",
          last_error: message.slice(0, 1000),
          worker_id: null,
          lease_expires_at: null,
          next_run_at: new Date(Date.now() + backoffSec * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } else {
      await admin
        .from("generation_jobs")
        .update({
          status: "dead_letter",
          last_error: message.slice(0, 1000),
          lease_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      await failGenerationAndReleaseCredits({
        adminSupabase: admin,
        generationId: job.generation_id,
        projectId: job.project_id,
        userId: job.user_id,
        errorMessage: `Pipeline failed after ${job.attempt_count} attempts: ${message}`,
      });
    }
  } finally {
    clearInterval(heartbeat);
  }
}

async function pollOnce() {
  if (shuttingDown || activeJobs >= MAX_CONCURRENCY || !isSupabaseAdminConfigured()) return;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("claim_next_generation_job", {
    p_worker_id: WORKER_ID,
    p_lease_seconds: LEASE_SECONDS,
  });

  if (error) {
    console.error(`[worker] claim_next_generation_job error: ${error.message}`);
    return;
  }

  const claimed = Array.isArray(data) ? data[0] : data;
  if (!claimed || !claimed.id) return;

  activeJobs += 1;
  void processSingleJob(claimed as GenerationJobRow).finally(() => {
    activeJobs -= 1;
  });
}

async function startWorker() {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: shuttingDown ? "draining" : "ok",
          workerId: WORKER_ID,
          activeJobs,
          maxConcurrency: MAX_CONCURRENCY,
          processedCount,
          failedCount,
          supabaseConfigured: isSupabaseAdminConfigured(),
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[worker] ${WORKER_ID} health endpoint listening on 0.0.0.0:${PORT}`);
  });

  const pollTimer = setInterval(() => {
    void pollOnce();
  }, POLL_INTERVAL_MS);

  const emailTimer = setInterval(() => {
    if (!shuttingDown && isSupabaseAdminConfigured()) {
      void flushPendingEmailOutbox(createSupabaseAdminClient()).catch(() => undefined);
    }
  }, 30_000);

  const shutdown = (signal: string) => {
    console.log(`[worker] Received ${signal}; draining ${activeJobs} active jobs...`);
    shuttingDown = true;
    clearInterval(pollTimer);
    clearInterval(emailTimer);
    server.close(() => {
      const waitDrain = setInterval(() => {
        if (activeJobs === 0) {
          clearInterval(waitDrain);
          process.exit(0);
        }
      }, 500);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

void startWorker();
