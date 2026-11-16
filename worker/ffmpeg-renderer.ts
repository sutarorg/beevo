import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { consumeGenerationCreditsRpc } from "../src/features/credits/service";
import {
  emitGenerationEvent,
  type GenerationJobRow,
} from "../src/features/pipeline/orchestrator";
import type { DynamicTimelineDocument } from "../src/features/timeline/generator";
import { estimateFfmpegRenderCost } from "../src/lib/pricing/provider-registry";
import {
  buildProjectR2Key,
  downloadBufferFromR2,
  uploadBufferToR2,
} from "../src/lib/r2/client";
import { enqueueAndSendEmail } from "../src/lib/resend/client";
import { buildVideoCompletedEmail } from "../src/lib/resend/templates";
import {
  buildChunkXfadeArgs,
  buildFinalMasterEncodeArgs,
  buildSegmentEncodeArgs,
  parseFfmpegProgressOutTimeSeconds,
  validateFfprobeJson,
} from "./ffmpeg-builder";

function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function runProcess(
  bin: string,
  args: string[],
  onStdout?: (chunk: string) => void
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (buf: Buffer) => {
      const str = buf.toString("utf8");
      stdout += str;
      onStdout?.(str);
    });
    child.stderr.on("data", (buf: Buffer) => {
      stderr += buf.toString("utf8");
    });

    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${bin} exited with code ${code}: ${stderr.slice(-800)}`));
      }
    });
  });
}

async function probeMp4(mp4Path: string) {
  const { stdout } = await runProcess("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    mp4Path,
  ]);
  return JSON.parse(stdout);
}

/**
 * Dedicated Railway FFmpeg Render Engine execution:
 * Pass 1 (zoompan clips) -> Pass 2A (chunked xfade) -> Pass 2B (ASS captions + sidechaincompress + loudnorm -> MP4)
 * -> ffprobe validation -> private R2 upload -> atomic credit consumption -> Video Ready notification & email.
 */
export async function executeVideoRenderJob(
  adminSupabase: SupabaseClient,
  job: GenerationJobRow,
  timelineId: string,
  workerId: string
): Promise<void> {
  const startedMs = Date.now();
  const { data: timelineRow } = await adminSupabase
    .from("timelines")
    .select("*")
    .eq("id", timelineId)
    .single();

  if (!timelineRow?.timeline_json) {
    throw new Error(`Timeline ${timelineId} not found.`);
  }

  const timeline = timelineRow.timeline_json as DynamicTimelineDocument;
  const { data: renderJob, error: rjErr } = await adminSupabase
    .from("render_jobs")
    .insert({
      generation_id: job.generation_id,
      user_id: job.user_id,
      worker_id: workerId,
      render_status: "running",
      total_frames: Math.round(timeline.totalDurationSeconds * timeline.fps),
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (rjErr || !renderJob) {
    throw new Error(`Failed creating render_jobs row: ${rjErr?.message}`);
  }

  const workDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `beevo-render-${job.generation_id.slice(0, 8)}-`)
  );

  try {
    // 1. Download narration, optional music, optional captions, and scene images from R2
    const narrationPath = path.join(workDir, "narration.mp3");
    await fs.writeFile(narrationPath, await downloadBufferFromR2(timeline.audio.narrationStorageKey));

    let musicPath: string | null = null;
    if (timeline.audio.musicStorageKey) {
      musicPath = path.join(workDir, "music.mp3");
      await fs.writeFile(musicPath, await downloadBufferFromR2(timeline.audio.musicStorageKey));
    }

    let assPath: string | null = null;
    if (timeline.captions.enabled && timeline.captions.assStorageKey) {
      assPath = path.join(workDir, "captions.ass");
      await fs.writeFile(assPath, await downloadBufferFromR2(timeline.captions.assStorageKey));
    }

    // 2. Pass 1 — Render individual animated scene clips
    const segmentClipPaths: string[] = [];
    for (let i = 0; i < timeline.segments.length; i++) {
      const seg = timeline.segments[i];
      const imgPath = path.join(workDir, `seg-${String(i).padStart(4, "0")}.png`);
      const clipPath = path.join(workDir, `clip-${String(i).padStart(4, "0")}.mp4`);

      await fs.writeFile(imgPath, await downloadBufferFromR2(seg.assetStorageKey));

      const segArgs = buildSegmentEncodeArgs({
        inputImagePath: imgPath,
        outputClipPath: clipPath,
        segment: seg,
        width: timeline.width,
        height: timeline.height,
        fps: timeline.fps,
      });
      await runProcess("ffmpeg", segArgs);
      segmentClipPaths.push(clipPath);
    }

    // 3. Pass 2A — Bounded chunked xfade assembly (12 clips max per batch)
    const CHUNK_SIZE = 12;
    const chunkPaths: string[] = [];
    for (let start = 0; start < segmentClipPaths.length; start += CHUNK_SIZE) {
      const batchClips = segmentClipPaths.slice(start, start + CHUNK_SIZE);
      const batchSegs = timeline.segments.slice(start, start + CHUNK_SIZE);
      const chunkOut = path.join(workDir, `chunk-${chunkPaths.length}.mp4`);
      const xfadeArgs = buildChunkXfadeArgs({
        clipPaths: batchClips,
        segments: batchSegs,
        outputChunkPath: chunkOut,
        fps: timeline.fps,
      });
      await runProcess("ffmpeg", xfadeArgs);
      chunkPaths.push(chunkOut);
    }

    let videoInputPath = chunkPaths[0];
    let isConcatList = false;
    if (chunkPaths.length > 1) {
      const concatListPath = path.join(workDir, "chunks.txt");
      await fs.writeFile(
        concatListPath,
        chunkPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"),
        "utf8"
      );
      videoInputPath = concatListPath;
      isConcatList = true;
    }

    // 4. Pass 2B — Final master MP4 encode
    const finalMp4Path = path.join(workDir, "final.mp4");
    const masterArgs = buildFinalMasterEncodeArgs({
      concatListOrVideoPath: videoInputPath,
      isConcatList,
      narrationPath,
      musicPath,
      assSubtitlePath: assPath,
      timeline,
      outputMp4Path: finalMp4Path,
    });

    let lastPct = 76;
    await runProcess("ffmpeg", masterArgs, (chunk) => {
      const outSec = parseFfmpegProgressOutTimeSeconds(chunk);
      if (outSec !== null && timeline.totalDurationSeconds > 0) {
        const pct = Math.min(94, 76 + Math.round((outSec / timeline.totalDurationSeconds) * 18));
        if (pct >= lastPct + 4) {
          lastPct = pct;
          void adminSupabase
            .from("generations")
            .update({ progress_percent: pct, updated_at: new Date().toISOString() })
            .eq("id", job.generation_id);
        }
      }
    });

    // 5. Probe & validate MP4
    const probeRaw = await probeMp4(finalMp4Path);
    const probeCheck = validateFfprobeJson(probeRaw, {
      width: timeline.width,
      height: timeline.height,
      durationSeconds: timeline.totalDurationSeconds,
    });
    if (!probeCheck.valid) {
      throw new Error(`FFprobe MP4 validation failed: ${probeCheck.errors.join("; ")}`);
    }

    // 6. Upload final MP4 to private Cloudflare R2
    await adminSupabase
      .from("generations")
      .update({
        current_stage: "final_mp4_upload",
        export_status: "running",
        progress_percent: 96,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.generation_id);

    const mp4Buf = await fs.readFile(finalMp4Path);
    const mp4Key = buildProjectR2Key({
      userId: job.user_id,
      projectId: job.project_id,
      folder: "renders",
      fileName: `video-${job.generation_id}.mp4`,
    });
    const uploadedMp4 = await uploadBufferToR2({
      storageKey: mp4Key,
      body: mp4Buf,
      contentType: "video/mp4",
      assetType: "finished_mp4",
    });

    const { data: mp4Asset } = await adminSupabase
      .from("assets")
      .insert({
        user_id: job.user_id,
        project_id: job.project_id,
        asset_type: "finished_mp4",
        storage_key: uploadedMp4.storageKey,
        file_type: "video/mp4",
        size_bytes: uploadedMp4.sizeBytes,
        sha256: sha256Hex(mp4Buf),
        metadata: {
          width: probeCheck.width,
          height: probeCheck.height,
          duration_seconds: probeCheck.durationSeconds,
        },
      })
      .select("id")
      .single();

    const renderDurationSeconds = Number(((Date.now() - startedMs) / 1000).toFixed(2));
    const computeCost = estimateFfmpegRenderCost(renderDurationSeconds);

    await adminSupabase.from("provider_usage").insert({
      user_id: job.user_id,
      project_id: job.project_id,
      generation_id: job.generation_id,
      provider: "ffmpeg",
      operation: "ffmpeg_hd_render",
      model_id: "railway_docker_ffmpeg",
      input_units: renderDurationSeconds,
      output_units: probeCheck.durationSeconds,
      unit_type: "compute_seconds",
      cost_usd: computeCost.costUsd,
      cost_inr: computeCost.costInr,
      cost_source: computeCost.costSource,
      provider_request_id: renderJob.id,
    });

    // 7. Atomically consume reserved credits!
    const { data: genRow } = await adminSupabase
      .from("generations")
      .select("reserved_credits")
      .eq("id", job.generation_id)
      .single();
    const creditsToConsume = Number(genRow?.reserved_credits ?? 0);

    if (creditsToConsume > 0) {
      await consumeGenerationCreditsRpc(adminSupabase, {
        userId: job.user_id,
        generationId: job.generation_id,
        credits: creditsToConsume,
        idempotencyKey: `consume:${job.generation_id}`,
      });
    }

    const nowIso = new Date().toISOString();
    await Promise.all([
      adminSupabase
        .from("render_jobs")
        .update({
          render_status: "completed",
          output_storage_key: uploadedMp4.storageKey,
          render_duration_seconds: renderDurationSeconds,
          output_duration_seconds: probeCheck.durationSeconds,
          compute_cost_inr: computeCost.costInr,
          completed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", renderJob.id),
      adminSupabase
        .from("generations")
        .update({
          generation_status: "completed",
          rendering_status: "completed",
          export_status: "completed",
          progress_percent: 100,
          consumed_credits: creditsToConsume,
          output_asset_id: mp4Asset?.id ?? null,
          completed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", job.generation_id),
      adminSupabase
        .from("projects")
        .update({ project_status: "completed", updated_at: nowIso })
        .eq("id", job.project_id),
    ]);

    await emitGenerationEvent(adminSupabase, {
      generationId: job.generation_id,
      userId: job.user_id,
      stage: "final_mp4_upload",
      eventType: "completed",
      message: "Final HD MP4 verified and stored privately in Cloudflare R2.",
      progressPercent: 100,
    });

    const { data: project } = await adminSupabase
      .from("projects")
      .select("title")
      .eq("id", job.project_id)
      .maybeSingle();

    await adminSupabase.from("notifications").insert({
      user_id: job.user_id,
      category: "generation",
      title: "Your Cartoon Video Is Ready",
      body: `"${project?.title ?? "Untitled Video"}" finished rendering (${Math.round(probeCheck.durationSeconds)}s).`,
      href: `/app/videos/${job.generation_id}`,
    });

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("email")
      .eq("user_id", job.user_id)
      .maybeSingle();

    if (profile?.email) {
      const mail = buildVideoCompletedEmail({
        projectTitle: project?.title ?? "Untitled Video",
        generationId: job.generation_id,
        durationSeconds: Math.round(probeCheck.durationSeconds),
        consumedCredits: creditsToConsume,
      });
      await enqueueAndSendEmail(adminSupabase, {
        userId: job.user_id,
        toEmail: profile.email,
        templateKey: "video_completed",
        subject: mail.subject,
        htmlBody: mail.html,
        idempotencyKey: `email:video_ready:${job.generation_id}`,
      });
    }
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
