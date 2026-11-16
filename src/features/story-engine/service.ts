import { createStructuredOpenAiResponse } from "@/lib/openai/client";

export interface ScriptGenerationInput {
  idea: string;
  durationSeconds: number;
  language: string;
  audience: string;
  cartoonStyle: string;
  narrationTone: string;
  customInstructions?: string;
}

export interface GeneratedScriptPayload {
  title: string;
  hook: string;
  fullScript: string;
  estimatedWordCount: number;
  estimatedSpeakingSeconds: number;
  narrativeArc: string[];
}

export interface VisualStyleBible {
  colorPalette: string;
  artDirection: string;
  characterAppearanceRules: string;
  backgroundStyle: string;
  lightingStyle: string;
  characterProportions: string;
  cameraLanguage: string;
  consistencyRules: string;
}

export interface PlannedCharacter {
  characterCode: string;
  characterName: string;
  characterDescription: string;
  visualIdentity: string;
  appearanceInstructions: string;
}

export interface PlannedScene {
  sceneId: string;
  sceneOrder: number;
  narrationText: string;
  narrativePurpose: string;
  imagePrompt: string;
  characterReferences: string[];
  location: string;
  composition: string;
  characterPose: string;
  characterExpression: string;
  lighting: string;
  cameraInstruction: string;
  captionKeywords: string[];
  transitionInstruction: string;
}

export interface DynamicStoryboardPayload {
  visualStyleBible: VisualStyleBible;
  characters: PlannedCharacter[];
  scenes: PlannedScene[];
}

const SCRIPT_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "hook",
    "fullScript",
    "estimatedWordCount",
    "estimatedSpeakingSeconds",
    "narrativeArc",
  ],
  properties: {
    title: { type: "string", minLength: 2 },
    hook: { type: "string", minLength: 5 },
    fullScript: { type: "string", minLength: 20 },
    estimatedWordCount: { type: "integer", minimum: 10 },
    estimatedSpeakingSeconds: { type: "integer", minimum: 10 },
    narrativeArc: { type: "array", items: { type: "string" } },
  },
};

const STORYBOARD_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["visualStyleBible", "characters", "scenes"],
  properties: {
    visualStyleBible: {
      type: "object",
      additionalProperties: false,
      required: [
        "colorPalette",
        "artDirection",
        "characterAppearanceRules",
        "backgroundStyle",
        "lightingStyle",
        "characterProportions",
        "cameraLanguage",
        "consistencyRules",
      ],
      properties: {
        colorPalette: { type: "string" },
        artDirection: { type: "string" },
        characterAppearanceRules: { type: "string" },
        backgroundStyle: { type: "string" },
        lightingStyle: { type: "string" },
        characterProportions: { type: "string" },
        cameraLanguage: { type: "string" },
        consistencyRules: { type: "string" },
      },
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "characterCode",
          "characterName",
          "characterDescription",
          "visualIdentity",
          "appearanceInstructions",
        ],
        properties: {
          characterCode: { type: "string" },
          characterName: { type: "string" },
          characterDescription: { type: "string" },
          visualIdentity: { type: "string" },
          appearanceInstructions: { type: "string" },
        },
      },
    },
    scenes: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sceneId",
          "sceneOrder",
          "narrationText",
          "narrativePurpose",
          "imagePrompt",
          "characterReferences",
          "location",
          "composition",
          "characterPose",
          "characterExpression",
          "lighting",
          "cameraInstruction",
          "captionKeywords",
          "transitionInstruction",
        ],
        properties: {
          sceneId: { type: "string" },
          sceneOrder: { type: "integer", minimum: 1 },
          narrationText: { type: "string", minLength: 1 },
          narrativePurpose: { type: "string" },
          imagePrompt: { type: "string", minLength: 10 },
          characterReferences: { type: "array", items: { type: "string" } },
          location: { type: "string" },
          composition: { type: "string" },
          characterPose: { type: "string" },
          characterExpression: { type: "string" },
          lighting: { type: "string" },
          cameraInstruction: { type: "string" },
          captionKeywords: { type: "array", items: { type: "string" } },
          transitionInstruction: { type: "string" },
        },
      },
    },
  },
};

/**
 * Step 1 & 2 — Generates a natural spoken narration script matched to requested duration.
 * Avoids repetitive filler and produces clean spoken prose ready for ElevenLabs TTS.
 */
export async function generateBeevoScript(input: ScriptGenerationInput) {
  const targetWords = Math.max(25, Math.round((input.durationSeconds / 60) * 145));
  const model = process.env.OPENAI_STORY_MODEL?.trim() || "gpt-4o-mini";

  const instructions = [
    "You are Beevo's lead cartoon story writer and narration scriptwriter.",
    "Write natural, vivid, spoken voiceover narration (hook, introduction, story development, main explanation/examples, progression, conclusion).",
    "Do NOT pad or repeat phrases artificially to fill time. Do NOT include stage directions, brackets, or timestamps inside fullScript—only clean spoken narration.",
    `Target spoken length: approximately ${targetWords} words for ${input.durationSeconds} seconds in language "${input.language}".`,
    `Audience: ${input.audience}. Tone: ${input.narrationTone}. Cartoon visual style: ${input.cartoonStyle}.`,
  ].join("\n");

  const userPrompt = [
    `User idea or draft:\n${input.idea}`,
    input.customInstructions ? `\nCustom instructions:\n${input.customInstructions}` : "",
  ].join("\n");

  return createStructuredOpenAiResponse<GeneratedScriptPayload>({
    model,
    instructions,
    input: userPrompt,
    schemaName: "beevo_narration_script",
    schema: SCRIPT_JSON_SCHEMA,
    temperature: 0.7,
  });
}

/**
 * Step 3, 4, 5 & 6 — Creates the Visual Style Bible, character planner, and
 * dynamically sized scene-level storyboard driven purely by narrative beats.
 */
export async function generateBeevoDynamicStoryboard(params: {
  script: string;
  durationSeconds: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  cartoonStyle: string;
  language: string;
  audience: string;
  visualPacing: "calm" | "balanced" | "dynamic";
  characterPreferences?: string;
  customInstructions?: string;
  maxScenes?: number;
}) {
  const model = process.env.OPENAI_STORYBOARD_MODEL?.trim() || "gpt-4o";
  const maxScenes = params.maxScenes ?? 160;

  const instructions = [
    "You are Beevo's Cartoon Storyboard Director, Character Designer, and Visual Prompt Architect.",
    "Break the approved narration script into a DYNAMIC number of scenes determined purely by visual narrative beats (new ideas, actions, location changes, character expressions, new objects, or educational visual shifts).",
    "NEVER force a fixed scene count or fixed scene duration.",
    "CRITICAL COVERAGE RULE: Concatenating every scene's narrationText in order MUST reproduce 100% of the approved narration script verbatim without omitting or inventing spoken sentences.",
    `Visual pacing preference: ${params.visualPacing} (calm = longer holds & fewer scene cuts; balanced = natural progression; dynamic = richer beat-by-beat illustration shifts).`,
    `Aspect ratio: ${params.aspectRatio}. Cartoon style: ${params.cartoonStyle}. Audience: ${params.audience}. Language: ${params.language}.`,
    `Safety ceiling: do not exceed ${maxScenes} scenes.`,
    "Every scene imagePrompt must be rich, self-contained cartoon art direction referencing the Visual Style Bible and exact character visual identities, with zero embedded watermark/UI text.",
  ].join("\n");

  const inputPrompt = [
    `Approved narration script:\n${params.script}`,
    params.characterPreferences ? `\nCharacter preferences:\n${params.characterPreferences}` : "",
    params.customInstructions ? `\nCustom visual instructions:\n${params.customInstructions}` : "",
  ].join("\n");

  const result = await createStructuredOpenAiResponse<DynamicStoryboardPayload>({
    model,
    instructions,
    input: inputPrompt,
    schemaName: "beevo_dynamic_storyboard",
    schema: STORYBOARD_JSON_SCHEMA,
    temperature: 0.5,
  });

  const validation = validateDynamicStoryboard({
    approvedScript: params.script,
    storyboard: result.data,
    maxScenes,
  });

  if (!validation.valid) {
    throw new Error(`Storyboard validation failed: ${validation.errors.join("; ")}`);
  }

  return { ...result, validation };
}

export interface StoryboardValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  coverageRatio: number;
  sceneCount: number;
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Step 6 — Validates narration coverage, unique scene ordering, valid character codes,
 * non-duplicate scenes, and resource ceilings.
 */
export function validateDynamicStoryboard(params: {
  approvedScript: string;
  storyboard: DynamicStoryboardPayload;
  maxScenes?: number;
}): StoryboardValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maxScenes = params.maxScenes ?? 160;
  const scenes = params.storyboard.scenes ?? [];

  if (scenes.length === 0) {
    errors.push("Storyboard must contain at least 1 scene.");
  }
  if (scenes.length > maxScenes) {
    errors.push(`Storyboard generated ${scenes.length} scenes, exceeding max limit of ${maxScenes}.`);
  }

  const knownCharCodes = new Set(
    (params.storyboard.characters ?? []).map((c) => c.characterCode.trim())
  );
  const seenPrompts = new Set<string>();

  scenes.forEach((scene, idx) => {
    if (scene.sceneOrder !== idx + 1) {
      warnings.push(`Scene ${scene.sceneId} has order ${scene.sceneOrder}; normalized to ${idx + 1}.`);
    }
    if (!scene.narrationText.trim()) {
      errors.push(`Scene #${idx + 1} has empty narrationText.`);
    }
    if (!scene.imagePrompt.trim() || scene.imagePrompt.trim().length < 10) {
      errors.push(`Scene #${idx + 1} imagePrompt is missing or too short.`);
    }
    const promptKey = scene.imagePrompt.trim().toLowerCase();
    if (seenPrompts.has(promptKey)) {
      warnings.push(`Scene #${idx + 1} duplicates an earlier imagePrompt.`);
    }
    seenPrompts.add(promptKey);

    for (const ref of scene.characterReferences ?? []) {
      if (knownCharCodes.size > 0 && !knownCharCodes.has(ref)) {
        warnings.push(`Scene #${idx + 1} references undeclared character code "${ref}".`);
      }
    }
  });

  // Verify narration coverage against approved script
  const scriptWords = normalizeWords(params.approvedScript);
  const sceneWords = normalizeWords(scenes.map((s) => s.narrationText).join(" "));
  const coverageRatio =
    scriptWords.length === 0
      ? 1
      : Math.min(1, sceneWords.length / Math.max(1, scriptWords.length));

  if (scriptWords.length >= 10 && coverageRatio < 0.75) {
    errors.push(
      `Storyboard narration covers only ${Math.round(coverageRatio * 100)}% of the approved script.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    coverageRatio: Number(coverageRatio.toFixed(3)),
    sceneCount: scenes.length,
  };
}
