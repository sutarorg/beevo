import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { alignNarrationToScenes } from "@/features/alignment/engine";
import {
  generateAssSubtitles,
  generateSrtSubtitles,
  type CaptionStyleConfig,
} from "@/features/captions/engine";
import { releaseGenerationCreditsRpc } from "@/features/credits/service";
import { buildDynamicTimeline, resolveOutputDimensions } from "@/features/timeline/generator";
import {
  mergeRebasedAlignments,
  splitScriptIntoSpeechChunks,
  synthesizeSpeechChunkWithTimestamps,
} from "@/lib/elevenlabs/client";
import { pollAndFetchFalImage, submitFalImageJob } from "@/lib/fal/client";
import {
  buildProjectR2Key,
  createSignedDownloadUrl,
  uploadBufferToR2,
} from "@/lib/r2/client";
import { enqueueAndSendEmail } from "@/lib/resend/client";
import { buildVideoFailedEmail } from "@/lib/resend/templates";

export interface GenerationJobRow {
  id: string;
  generation_id: string;
  project_id: string;
  user_id: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  cancel_requested: boolean;
  payload: Record<string, unknown>;
}

function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function isCancelled(adminSupabase: SupabaseClient, generationId: string): Promise<boolean> {
  const { data } = await adminSupabase
    .from("generations")
    .select("generation_status, cancel_requested")
    .eq("id", generationId)
    .maybeSingle();
  return Boolean(data?.cancel_requested || data?.generation_status === "cancelled");
}

export async function emitGenerationEvent(
  adminSupabase: SupabaseClient,
  params: {
    generationId: string;
    userId: string;
    stage: string;
    eventType: string;
    message: string;
    progressPercent?: number;
    payload?: Record<string, unknown>;
  }
) {
  await adminSupabase.from("generation_events").insert({
    generation_id: params.generationId,
    user_id: params.userId,
    stage: params.stage,
    event_type: params.eventType,
    message: params.message,
    progress_percent: params.progressPercent ?? null,
    payload: params.payload ?? {},
  });
}

/**
 * Prepares all pre-render media assets for a generation job cleanly:
 *  1. Character reference images (fal.ai image-only FLUX 3 Klein)
 *  2. Dynamic N-scene illustrations (fal.ai image-only FLUX 3 Klein) with live X / N progress
 *  3. ElevenLabs TTS with character-level timestamps (sentence-boundary chunking + rebasing)
 *  4. Beevo Custom Audio Alignment + ASS/SRT captions + Dynamic Timeline JSON
 * Returns the saved `timelineId` ready for the Railway FFmpeg Render Engine!
 */
export async function executeMediaPipelineStages(
  adminSupabase: SupabaseClient,
  job: GenerationJobRow
): Promise<{ timelineId: string; cancelled: boolean }> {
  const { data: project, error: projErr } = await adminSupabase
    .from("projects")
    .select("*, project_settings(*)")
    .eq("id", job.project_id)
    .single();
  if (projErr || !project) {
    throw new Error(`Project ${job.project_id} not found.`);
  }

  const settings = Array.isArray(project.project_settings)
    ? project.project_settings[0]
    : project.project_settings;

  const { data: gen } = await adminSupabase
    .from("generations")
    .select("*")
    .eq("id", job.generation_id)
    .single();

  if (!gen) throw new Error(`Generation ${job.generation_id} not found.`);

  const aspectRatio = (project.aspect_ratio as "16:9" | "9:16" | "1:1") || "16:9";
  const resolution = (project.resolution as "720p" | "1080p") || "1080p";

  // Load storyboard + characters + scenes
  const [{ data: storyboard }, { data: characters }, { data: scenes }] = await Promise.all([
    adminSupabase
      .from("storyboards")
      .select("*")
      .eq("project_id", job.project_id)
      .order("version", { ascending: false })
      .limit(1)
      .single(),
    adminSupabase
      .from("characters")
      .select("*")
      .eq("project_id", job.project_id)
      .order("created_at", { ascending: true }),
    adminSupabase
      .from("scenes")
      .select("*")
      .eq("project_id", job.project_id)
      .order("scene_number", { ascending: true }),
  ]);

  const sceneList = scenes ?? [];
  if (sceneList.length === 0) {
    throw new Error("Storyboard contains zero scenes.");
  }

  // ------------------------------------------------------------------------
  // STAGE 1: Character Reference Sheet Generation (fal.ai FLUX 3 Klein)
  // ------------------------------------------------------------------------
  if (await isCancelled(adminSupabase, job.generation_id)) {
    return { timelineId: "", cancelled: true };
  }

  await adminSupabase
    .from("generations")
    .update({
      generation_status: "running",
      current_stage: "character_generation",
      progress_percent: 10,
      dynamic_image_count: sceneList.length,
      started_at: gen.started_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.generation_id);

  await emitGenerationEvent(adminSupabase, {
    generationId: job.generation_id,
    userId: job.user_id,
    stage: "character_generation",
    eventType: "stage_started",
    message: `Preparing ${(characters ?? []).length} character reference sheets...`,
    progressPercent: 10,
  });

  const styleSummary = storyboard?.visual_style_bible
    ? JSON.stringify(storyboard.visual_style_bible).slice(0, 400)
    : "";

  const charRefUrlByCode = new Map<string, string>();

  for (const char of characters ?? []) {
    if (await isCancelled(adminSupabase, job.generation_id)) {
      return { timelineId: "", cancelled: true };
    }

    let storageKey: string | null = null;
    if (char.reference_asset_id) {
      const { data: existingAsset } = await adminSupabase
        .from("assets")
        .select("storage_key")
        .eq("id", char.reference_asset_id)
        .maybeSingle();
      storageKey = existingAsset?.storage_key ?? null;
    }

    if (!storageKey) {
      const prompt = [
        `Cartoon character reference sheet portrait of ${char.character_name}.`,
        char.visual_identity,
        char.appearance_instructions,
        styleSummary ? `Style bible: ${styleSummary}` : "",
        "Centered character, clean neutral studio backdrop, crisp cartoon illustration, zero text.",
      ]
        .filter(Boolean)
        .join(" ");

      const submitted = await submitFalImageJob({
        prompt,
        aspectRatio: "1:1",
      });
      const result = await pollAndFetchFalImage({
        submitted,
        expectedAspectRatio: "1:1",
      });

      storageKey = buildProjectR2Key({
        userId: job.user_id,
        projectId: job.project_id,
        folder: "characters",
        fileName: `${char.character_code}-${Date.now()}.png`,
      });
      const uploaded = await uploadBufferToR2({
        storageKey,
        body: result.buffer,
        contentType: `image/${result.format}`,
        assetType: "character_reference",
      });

      const { data: assetRow } = await adminSupabase
        .from("assets")
        .insert({
          user_id: job.user_id,
          project_id: job.project_id,
          asset_type: "character_reference",
          storage_key: uploaded.storageKey,
          file_type: `image/${result.format}`,
          size_bytes: uploaded.sizeBytes,
          sha256: sha256Hex(result.buffer),
          metadata: { width: result.width, height: result.height, model_id: result.modelId },
        })
        .select("id")
        .single();

      if (assetRow?.id) {
        await adminSupabase
          .from("characters")
          .update({ reference_asset_id: assetRow.id, updated_at: new Date().toISOString() })
          .eq("id", char.id);
      }

      await adminSupabase.from("provider_usage").insert({
        user_id: job.user_id,
        project_id: job.project_id,
        generation_id: job.generation_id,
        provider: "fal_ai",
        operation: "character_reference_image",
        model_id: result.modelId,
        input_units: 1,
        output_units: 1,
        unit_type: "image",
        cost_usd: result.costUsd,
        cost_inr: result.costInr,
        cost_source: result.costSource,
        provider_request_id: result.requestId,
      });
    }

    if (storageKey) {
      const signed = await createSignedDownloadUrl({ storageKey, expiresInSeconds: 1800 });
      charRefUrlByCode.set(char.character_code, signed.url);
    }
  }

  // ------------------------------------------------------------------------
  // STAGE 2: Dynamic N-Scene Illustration Generation (fal.ai FLUX 3 Klein)
  // ------------------------------------------------------------------------
  await adminSupabase
    .from("generations")
    .update({
      current_stage: "image_generation",
      dynamic_image_count: sceneList.length,
      completed_image_count: 0,
      progress_percent: 18,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.generation_id);

  await emitGenerationEvent(adminSupabase, {
    generationId: job.generation_id,
    userId: job.user_id,
    stage: "image_generation",
    eventType: "progress",
    message: `Generated images: 0 / ${sceneList.length}`,
    progressPercent: 18,
    payload: { generatedImages: 0, totalImages: sceneList.length },
  });

  const sceneKeyMap = new Map<string, string>();
  let completedImages = 0;

  for (const scene of sceneList) {
    if (await isCancelled(adminSupabase, job.generation_id)) {
      return { timelineId: "", cancelled: true };
    }

    // Resume-safe: reuse existing validated active scene image if already rendered
    const { data: existingSceneAsset } = await adminSupabase
      .from("scene_assets")
      .select("asset_id, assets(storage_key)")
      .eq("scene_id", scene.id)
      .eq("is_active", true)
      .eq("validation_status", "validated")
      .maybeSingle();

    const existingObj = existingSceneAsset
      ? Array.isArray(existingSceneAsset.assets)
        ? existingSceneAsset.assets[0]
        : existingSceneAsset.assets
      : null;

    if (existingObj?.storage_key) {
      sceneKeyMap.set(scene.id, existingObj.storage_key);
      completedImages += 1;
      continue;
    }

    await adminSupabase
      .from("scenes")
      .update({ scene_status: "generating", updated_at: new Date().toISOString() })
      .eq("id", scene.id);

    const charCodes: string[] = Array.isArray(scene.character_reference_ids)
      ? scene.character_reference_ids
      : [];
    const refUrls = charCodes
      .map((code) => charRefUrlByCode.get(code))
      .filter((u): u is string => Boolean(u))
      .slice(0, 6);

    const submitted = await submitFalImageJob({
      prompt: scene.detailed_image_prompt,
      aspectRatio,
      referenceImageUrls: refUrls,
    });
    const result = await pollAndFetchFalImage({
      submitted,
      expectedAspectRatio: aspectRatio,
    });

    const storageKey = buildProjectR2Key({
      userId: job.user_id,
      projectId: job.project_id,
      folder: "scenes",
      fileName: `scene-${String(scene.scene_number).padStart(4, "0")}-${Date.now()}.png`,
    });
    const uploaded = await uploadBufferToR2({
      storageKey,
      body: result.buffer,
      contentType: `image/${result.format}`,
      assetType: "cartoon_image",
    });

    const { data: assetRow } = await adminSupabase
      .from("assets")
      .insert({
        user_id: job.user_id,
        project_id: job.project_id,
        asset_type: "cartoon_image",
        storage_key: uploaded.storageKey,
        file_type: `image/${result.format}`,
        size_bytes: uploaded.sizeBytes,
        sha256: sha256Hex(result.buffer),
        metadata: { width: result.width, height: result.height, model_id: result.modelId },
      })
      .select("id")
      .single();

    await adminSupabase.from("scene_assets").insert({
      user_id: job.user_id,
      project_id: job.project_id,
      scene_id: scene.id,
      asset_id: assetRow?.id ?? null,
      fal_request_id: result.requestId,
      model_id: result.modelId,
      width: result.width,
      height: result.height,
      is_active: true,
      validation_status: "validated",
      cost_inr: result.costInr,
    });

    await adminSupabase
      .from("scenes")
      .update({ scene_status: "completed", updated_at: new Date().toISOString() })
      .eq("id", scene.id);

    await adminSupabase.from("provider_usage").insert({
      user_id: job.user_id,
      project_id: job.project_id,
      generation_id: job.generation_id,
      provider: "fal_ai",
      operation: "scene_image_generation",
      model_id: result.modelId,
      input_units: 1,
      output_units: 1,
      unit_type: "image",
      cost_usd: result.costUsd,
      cost_inr: result.costInr,
      cost_source: result.costSource,
      provider_request_id: result.requestId,
    });

    sceneKeyMap.set(scene.id, uploaded.storageKey);
    completedImages += 1;
    const pct = Math.min(54, 18 + Math.round((completedImages / sceneList.length) * 36));

    await adminSupabase
      .from("generations")
      .update({
        completed_image_count: completedImages,
        progress_percent: pct,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.generation_id);

    await emitGenerationEvent(adminSupabase, {
      generationId: job.generation_id,
      userId: job.user_id,
      stage: "image_generation",
      eventType: "image_completed",
      message: `Generated images: ${completedImages} / ${sceneList.length}`,
      progressPercent: pct,
      payload: {
        sceneNumber: scene.scene_number,
        generatedImages: completedImages,
        totalImages: sceneList.length,
      },
    });
  }

  // ------------------------------------------------------------------------
  // STAGE 3: ElevenLabs Voiceover Narration with Character-Level Timestamps
  // ------------------------------------------------------------------------
  if (await isCancelled(adminSupabase, job.generation_id)) {
    return { timelineId: "", cancelled: true };
  }

  const voiceId = settings?.voice_id;
  if (!voiceId) {
    throw new Error("Project has no ElevenLabs voice_id configured.");
  }
  const fullScript = (storyboard?.script || project.script || "").trim();
  if (!fullScript) {
    throw new Error("Project narration script is empty.");
  }

  await adminSupabase
    .from("generations")
    .update({
      current_stage: "voice_generation",
      voice_status: "running",
      progress_percent: 58,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.generation_id);

  const modelId = process.env.ELEVENLABS_DEFAULT_MODEL?.trim() || "eleven_multilingual_v2";
  const chunks = splitScriptIntoSpeechChunks(fullScript, modelId);
  const voiceParams = (settings?.voice_parameters as Record<string, unknown>) ?? {};

  const chunkBuffers: Buffer[] = [];
  const alignmentSegments: {
    alignment: Awaited<ReturnType<typeof synthesizeSpeechChunkWithTimestamps>>["alignment"];
    durationSeconds: number;
  }[] = [];

  let totalBillableChars = 0;
  let totalAudioDuration = 0;
  let totalVoiceCostUsd = 0;
  let totalVoiceCostInr = 0;

  for (let i = 0; i < chunks.length; i++) {
    if (await isCancelled(adminSupabase, job.generation_id)) {
      return { timelineId: "", cancelled: true };
    }
    const res = await synthesizeSpeechChunkWithTimestamps({
      voiceId,
      modelId,
      text: chunks[i],
      chunkIndex: i,
      languageCode: project.language?.slice(0, 2) || null,
      previousText: i > 0 ? chunks[i - 1] : null,
      nextText: i + 1 < chunks.length ? chunks[i + 1] : null,
      voiceSettings: {
        stability: Number(voiceParams.stability ?? 0.5),
        similarity_boost: Number(voiceParams.similarity_boost ?? 0.75),
        style: Number(voiceParams.style ?? 0.25),
        use_speaker_boost: Boolean(voiceParams.use_speaker_boost ?? true),
        speed: Number(settings?.speech_speed ?? 1.0),
      },
    });

    chunkBuffers.push(res.audioBuffer);
    alignmentSegments.push({
      alignment: res.alignment,
      durationSeconds: res.estimatedChunkDurationSeconds,
    });
    totalBillableChars += res.billableCharacters;
    totalAudioDuration += res.estimatedChunkDurationSeconds;
    totalVoiceCostUsd += res.costUsd;
    totalVoiceCostInr += res.costInr;

    await adminSupabase.from("voice_generations").insert({
      user_id: job.user_id,
      project_id: job.project_id,
      generation_id: job.generation_id,
      voice_id: voiceId,
      model_id: modelId,
      chunk_index: i,
      script_chunk: chunks[i],
      character_alignment: res.alignment,
      normalized_alignment: res.normalizedAlignment,
      actual_audio_duration_seconds: res.estimatedChunkDurationSeconds,
      billable_characters: res.billableCharacters,
      status: "completed",
      actual_cost_inr: res.costInr,
      cost_source: res.costSource,
      provider_request_id: res.requestId,
    });
  }

  const combinedAudioBuffer = Buffer.concat(chunkBuffers);
  const mergedAlignment = mergeRebasedAlignments(alignmentSegments);

  const narrationKey = buildProjectR2Key({
    userId: job.user_id,
    projectId: job.project_id,
    folder: "audio",
    fileName: `narration-${job.generation_id}.mp3`,
  });
  const uploadedNarration = await uploadBufferToR2({
    storageKey: narrationKey,
    body: combinedAudioBuffer,
    contentType: "audio/mpeg",
    assetType: "narration_track",
  });

  await adminSupabase.from("assets").insert({
    user_id: job.user_id,
    project_id: job.project_id,
    asset_type: "narration_track",
    storage_key: uploadedNarration.storageKey,
    file_type: "audio/mpeg",
    size_bytes: uploadedNarration.sizeBytes,
    sha256: sha256Hex(combinedAudioBuffer),
    metadata: { duration_seconds: totalAudioDuration, voice_id: voiceId, model_id: modelId },
  });

  await adminSupabase.from("provider_usage").insert({
    user_id: job.user_id,
    project_id: job.project_id,
    generation_id: job.generation_id,
    provider: "elevenlabs",
    operation: "narration_tts_with_timestamps",
    model_id: modelId,
    input_units: totalBillableChars,
    output_units: totalAudioDuration,
    unit_type: "characters",
    cost_usd: Number(totalVoiceCostUsd.toFixed(6)),
    cost_inr: Number(totalVoiceCostInr.toFixed(4)),
    cost_source: "estimated",
  });

  await adminSupabase
    .from("generations")
    .update({
      voice_status: "completed",
      current_stage: "audio_synchronization",
      alignment_status: "running",
      progress_percent: 68,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.generation_id);

  // ------------------------------------------------------------------------
  // STAGE 4: Beevo Custom Audio Alignment + Captions + Dynamic Timeline
  // ------------------------------------------------------------------------
  const aligned = alignNarrationToScenes({
    alignment: mergedAlignment,
    scenes: sceneList.map((s) => ({
      sceneId: s.id,
      sceneNumber: s.scene_number,
      narrationText: s.narration_text,
      transition: s.transition,
      cameraInstruction: s.camera_angle,
    })),
    actualAudioDurationSeconds: totalAudioDuration,
    visualPacing: (settings?.visual_pacing as "calm" | "balanced" | "dynamic") ?? "balanced",
    defaultTransition: settings?.transition_style ?? "crossfade",
  });

  if (!aligned.validation.valid) {
    throw new Error(`Audio alignment validation failed: ${aligned.validation.errors.join("; ")}`);
  }

  const dims = resolveOutputDimensions(aspectRatio, resolution);
  const rawCap = (settings?.captions as Partial<CaptionStyleConfig>) ?? {};
  const captionStyle: CaptionStyleConfig = {
    enabled: rawCap.enabled ?? true,
    mode: rawCap.mode ?? "word_highlight",
    position: rawCap.position ?? "bottom",
    size: rawCap.size ?? "medium",
    font: rawCap.font ?? "Noto Sans",
    color: rawCap.color ?? "#FFFFFF",
    highlightColor: rawCap.highlightColor ?? "#FFC928",
    backgroundColor: rawCap.backgroundColor ?? "#171717CC",
  };

  const assOut = generateAssSubtitles({
    words: aligned.words,
    style: captionStyle,
    videoWidth: dims.width,
    videoHeight: dims.height,
  });
  const srtContent = generateSrtSubtitles(aligned.words);

  let assStorageKey: string | null = null;
  let srtStorageKey: string | null = null;

  if (captionStyle.enabled && captionStyle.mode !== "off") {
    assStorageKey = buildProjectR2Key({
      userId: job.user_id,
      projectId: job.project_id,
      folder: "renders",
      fileName: `captions-${job.generation_id}.ass`,
    });
    const assBuf = Buffer.from(assOut.assContent, "utf8");
    const upAss = await uploadBufferToR2({
      storageKey: assStorageKey,
      body: assBuf,
      contentType: "text/plain",
      assetType: "captions",
    });
    await adminSupabase.from("assets").insert({
      user_id: job.user_id,
      project_id: job.project_id,
      asset_type: "captions",
      storage_key: upAss.storageKey,
      file_type: "text/plain",
      size_bytes: upAss.sizeBytes,
      sha256: sha256Hex(assBuf),
    });

    srtStorageKey = buildProjectR2Key({
      userId: job.user_id,
      projectId: job.project_id,
      folder: "renders",
      fileName: `captions-${job.generation_id}.srt`,
    });
    const srtBuf = Buffer.from(srtContent, "utf8");
    await uploadBufferToR2({
      storageKey: srtStorageKey,
      body: srtBuf,
      contentType: "application/x-subrip",
      assetType: "captions",
    });
  }

  let musicStorageKey: string | null = null;
  if (settings?.background_music_id) {
    const { data: track } = await adminSupabase
      .from("music_library")
      .select("storage_key")
      .eq("id", settings.background_music_id)
      .eq("active", true)
      .maybeSingle();
    musicStorageKey = track?.storage_key ?? null;
  }

  const { data: genConfig } = await adminSupabase
    .from("system_configuration")
    .select("value")
    .eq("key", "generation")
    .maybeSingle();
  const maxScenesLimit = Number(genConfig?.value?.maxScenesPerProject ?? 160);
  const maxAssetsLimit = Number(genConfig?.value?.maxAssetsPerProject ?? 200);

  const { data: prevTl } = await adminSupabase
    .from("timelines")
    .select("version")
    .eq("project_id", job.project_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = Number(prevTl?.version ?? 0) + 1;

  const timelineDoc = buildDynamicTimeline({
    projectId: job.project_id,
    version: nextVersion,
    aspectRatio,
    resolution,
    alignedScenes: aligned.sceneTimings,
    sceneImageStorageKeys: sceneKeyMap,
    narrationStorageKey: uploadedNarration.storageKey,
    totalAudioDurationSeconds: aligned.totalAudioDurationSeconds,
    cameraPreference: settings?.camera_movements ?? "automatic",
    transitionPreference: settings?.transition_style ?? "automatic",
    musicStorageKey,
    musicVolume: Number(settings?.music_volume ?? 0.2),
    captionStyle,
    captionCues: assOut.cues,
    assStorageKey,
    srtStorageKey,
    maxScenesLimit,
    maxAssetsLimit,
  });

  const { data: timelineRow, error: tlErr } = await adminSupabase
    .from("timelines")
    .insert({
      user_id: job.user_id,
      project_id: job.project_id,
      storyboard_id: storyboard?.id ?? null,
      version: nextVersion,
      timeline_json: timelineDoc,
      scene_timings: aligned.sceneTimings,
      audio_references: timelineDoc.audio,
      caption_timing: assOut.cues,
      total_duration_seconds: timelineDoc.totalDurationSeconds,
      rendering_configuration: { width: dims.width, height: dims.height, fps: 30 },
    })
    .select("id")
    .single();

  if (tlErr || !timelineRow) {
    throw new Error(`Failed saving timeline: ${tlErr?.message}`);
  }

  await adminSupabase
    .from("generations")
    .update({
      timeline_id: timelineRow.id,
      alignment_status: "completed",
      current_stage: "ffmpeg_rendering",
      rendering_status: "running",
      progress_percent: 74,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.generation_id);

  await emitGenerationEvent(adminSupabase, {
    generationId: job.generation_id,
    userId: job.user_id,
    stage: "dynamic_timeline",
    eventType: "stage_completed",
    message: `Aligned ${aligned.sceneTimings.length} dynamic segments across ${timelineDoc.totalDurationSeconds.toFixed(1)}s.`,
    progressPercent: 74,
  });

  return { timelineId: timelineRow.id, cancelled: false };
}

/**
 * Terminal failure handler: marks generation failed, releases unused reserved credits
 * atomically via PostgreSQL RPC, creates in-app notification, and queues Resend alert.
 */
export async function failGenerationAndReleaseCredits(params: {
  adminSupabase: SupabaseClient;
  generationId: string;
  projectId: string;
  userId: string;
  errorMessage: string;
}) {
  const { data: gen } = await params.adminSupabase
    .from("generations")
    .select("reserved_credits, consumed_credits")
    .eq("id", params.generationId)
    .maybeSingle();

  const reserved = Number(gen?.reserved_credits ?? 0);
  const consumed = Number(gen?.consumed_credits ?? 0);
  const releasable = Math.max(0, reserved - consumed);

  if (releasable > 0) {
    await releaseGenerationCreditsRpc(params.adminSupabase, {
      userId: params.userId,
      generationId: params.generationId,
      credits: releasable,
      idempotencyKey: `release:fail:${params.generationId}`,
      reason: params.errorMessage.slice(0, 140),
    });
  }

  const nowIso = new Date().toISOString();
  await Promise.all([
    params.adminSupabase
      .from("generations")
      .update({
        generation_status: "failed",
        error_code: "PIPELINE_FAILED",
        error_details: { message: params.errorMessage.slice(0, 1000) },
        completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", params.generationId),
    params.adminSupabase
      .from("projects")
      .update({ project_status: "failed", updated_at: nowIso })
      .eq("id", params.projectId),
  ]);

  const { data: project } = await params.adminSupabase
    .from("projects")
    .select("title")
    .eq("id", params.projectId)
    .maybeSingle();

  await params.adminSupabase.from("notifications").insert({
    user_id: params.userId,
    category: "generation",
    title: "Video Generation Failed",
    body: `${project?.title ?? "Your project"} failed. ${releasable} reserved credits were returned to your wallet.`,
    href: `/app/generations/${params.generationId}`,
  });

  const { data: profile } = await params.adminSupabase
    .from("profiles")
    .select("email")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (profile?.email) {
    const mail = buildVideoFailedEmail({
      projectTitle: project?.title ?? "Untitled Project",
      generationId: params.generationId,
      releasedCredits: releasable,
      reason: params.errorMessage.slice(0, 180),
    });
    await enqueueAndSendEmail(params.adminSupabase, {
      userId: params.userId,
      toEmail: profile.email,
      templateKey: "video_failed",
      subject: mail.subject,
      htmlBody: mail.html,
      idempotencyKey: `email:gen_failed:${params.generationId}`,
    });
  }
}
