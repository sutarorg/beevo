import { requireEnv } from "@/lib/env";
import {
  ELEVENLABS_MODEL_PRICING,
  estimateElevenLabsCost,
} from "@/lib/pricing/provider-registry";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

export interface ElevenLabsCharacterAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface ElevenLabsVoiceCatalogItem {
  voiceId: string;
  name: string;
  category: string;
  accent: string | null;
  language: string | null;
  gender: string | null;
  description: string | null;
  previewUrl: string | null;
}

export interface ElevenLabsChunkSynthesisResult {
  chunkIndex: number;
  text: string;
  audioBuffer: Buffer;
  alignment: ElevenLabsCharacterAlignment;
  normalizedAlignment: ElevenLabsCharacterAlignment | null;
  estimatedChunkDurationSeconds: number;
  billableCharacters: number;
  requestId: string | null;
  costUsd: number;
  costInr: number;
  costSource: "actual" | "estimated";
}

/**
 * Splits long-form narration safely at sentence boundaries while staying strictly below
 * the chosen ElevenLabs model's documented per-request character limit.
 */
export function splitScriptIntoSpeechChunks(
  script: string,
  modelId = "eleven_multilingual_v2",
  maxChunkCharsOverride?: number
): string[] {
  const modelMeta =
    ELEVENLABS_MODEL_PRICING[modelId] ?? ELEVENLABS_MODEL_PRICING.eleven_multilingual_v2;
  // Leave generous headroom below hard cap for continuity & alignment stability
  const safeLimit = Math.min(
    maxChunkCharsOverride ?? 4_200,
    Math.floor(modelMeta.maxCharsPerRequest * 0.85)
  );

  const normalized = script.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= safeLimit) return [normalized];

  // Sentence segmentation preserving Latin & Devanagari (।) sentence terminators
  const sentences = normalized
    .split(/(?<=[.!?।])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > safeLimit) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      // Hard-split exceptionally long run-on sentence on whitespace boundaries
      const words = sentence.split(/\s+/);
      let piece = "";
      for (const word of words) {
        const candidate = piece ? `${piece} ${word}` : word;
        if (candidate.length > safeLimit && piece) {
          chunks.push(piece.trim());
          piece = word;
        } else {
          piece = candidate;
        }
      }
      if (piece) chunks.push(piece.trim());
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > safeLimit && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Rebases character start/end timestamps across multi-chunk ElevenLabs narration outputs
 * using exact probed audio durations so downstream alignment stays frame-accurate.
 */
export function mergeRebasedAlignments(
  chunks: { alignment: ElevenLabsCharacterAlignment; durationSeconds: number }[]
): ElevenLabsCharacterAlignment {
  const characters: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (i > 0 && characters.length > 0 && characters[characters.length - 1] !== " ") {
      characters.push(" ");
      starts.push(Number(offset.toFixed(4)));
      ends.push(Number(offset.toFixed(4)));
    }
    const len = Math.min(
      chunk.alignment.characters.length,
      chunk.alignment.character_start_times_seconds.length,
      chunk.alignment.character_end_times_seconds.length
    );
    for (let j = 0; j < len; j++) {
      characters.push(chunk.alignment.characters[j]);
      starts.push(Number((chunk.alignment.character_start_times_seconds[j] + offset).toFixed(4)));
      ends.push(Number((chunk.alignment.character_end_times_seconds[j] + offset).toFixed(4)));
    }
    offset += chunk.durationSeconds;
  }

  return {
    characters,
    character_start_times_seconds: starts,
    character_end_times_seconds: ends,
  };
}

/**
 * Fetches live available voices directly from the ElevenLabs catalog.
 * Never returns invented or hardcoded synthetic voices.
 */
export async function listElevenLabsVoices(): Promise<ElevenLabsVoiceCatalogItem[]> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY", "ElevenLabs");
  const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: { "xi-api-key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs voices catalog request failed (${res.status}).`);
  }

  const json = (await res.json()) as {
    voices?: {
      voice_id: string;
      name: string;
      category?: string;
      preview_url?: string | null;
      description?: string | null;
      labels?: Record<string, string>;
    }[];
  };

  return (json.voices ?? []).map((v) => ({
    voiceId: v.voice_id,
    name: v.name,
    category: v.category ?? "premade",
    accent: v.labels?.accent ?? null,
    language: v.labels?.language ?? null,
    gender: v.labels?.gender ?? null,
    description: v.description ?? v.labels?.description ?? null,
    previewUrl: v.preview_url ?? null,
  }));
}

/**
 * Official documented endpoint:
 * POST /v1/text-to-speech/{voice_id}/with-timestamps
 */
export async function synthesizeSpeechChunkWithTimestamps(params: {
  voiceId: string;
  modelId?: string;
  text: string;
  chunkIndex: number;
  languageCode?: string | null;
  previousText?: string | null;
  nextText?: string | null;
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
    speed?: number;
  };
}): Promise<ElevenLabsChunkSynthesisResult> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY", "ElevenLabs");
  if (!params.voiceId.trim()) {
    throw new Error("A genuine ElevenLabs voice_id is required.");
  }

  const modelId =
    params.modelId ?? process.env.ELEVENLABS_DEFAULT_MODEL?.trim() ?? "eleven_multilingual_v2";

  const body: Record<string, unknown> = {
    text: params.text,
    model_id: modelId,
    ...(params.languageCode ? { language_code: params.languageCode } : {}),
    ...(params.previousText ? { previous_text: params.previousText.slice(-500) } : {}),
    ...(params.nextText ? { next_text: params.nextText.slice(0, 500) } : {}),
    ...(params.voiceSettings ? { voice_settings: params.voiceSettings } : {}),
  };

  const url = `${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(params.voiceId)}/with-timestamps?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${errText.slice(0, 300)}`);
  }

  const requestId = res.headers.get("request-id");
  const charCostHeader = res.headers.get("character-cost");
  const json = (await res.json()) as {
    audio_base64?: string;
    alignment?: ElevenLabsCharacterAlignment | null;
    normalized_alignment?: ElevenLabsCharacterAlignment | null;
  };

  if (!json.audio_base64) {
    throw new Error("ElevenLabs response missing audio_base64 payload.");
  }
  const alignment = json.alignment ?? json.normalized_alignment;
  if (!alignment || alignment.characters.length === 0) {
    throw new Error("ElevenLabs response missing character alignment timestamps.");
  }

  const audioBuffer = Buffer.from(json.audio_base64, "base64");
  if (audioBuffer.length < 256) {
    throw new Error("ElevenLabs returned an empty or truncated audio buffer.");
  }

  const endTimes = alignment.character_end_times_seconds;
  const estimatedChunkDurationSeconds = endTimes.length > 0 ? endTimes[endTimes.length - 1] : 0;
  const billableCharacters = charCostHeader
    ? Number.parseInt(charCostHeader, 10) || params.text.length
    : params.text.length;
  const cost = estimateElevenLabsCost(modelId, billableCharacters);

  return {
    chunkIndex: params.chunkIndex,
    text: params.text,
    audioBuffer,
    alignment,
    normalizedAlignment: json.normalized_alignment ?? null,
    estimatedChunkDurationSeconds,
    billableCharacters,
    requestId,
    costUsd: cost.costUsd,
    costInr: cost.costInr,
    costSource: cost.costSource,
  };
}
