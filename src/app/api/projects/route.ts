import { calculateRequiredCreditsServer } from "@/features/credits/service";
import { requireUser } from "@/lib/security/auth";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/security/http";
import { createProjectSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireUser();
    const { data, error } = await auth.adminSupabase
      .from("projects")
      .select(
        "id, title, project_status, aspect_ratio, resolution, requested_duration_seconds, visual_style, updated_at"
      )
      .eq("user_id", auth.userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return jsonOk({
      projects: (data ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.project_status,
        aspectRatio: p.aspect_ratio,
        resolution: p.resolution,
        durationSeconds: Number(p.requested_duration_seconds),
        styleId: p.visual_style,
        updatedAt: p.updated_at,
        generationId: null,
        videoId: null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    const parsed = await parseJsonBody(request, createProjectSchema);
    const creditsRequired = calculateRequiredCreditsServer(parsed.durationSeconds);

    const { data: project, error } = await auth.adminSupabase
      .from("projects")
      .insert({
        user_id: auth.userId,
        title: parsed.title,
        original_idea: parsed.originalIdea,
        script: parsed.script ?? null,
        requested_duration_seconds: parsed.durationSeconds,
        aspect_ratio: parsed.aspectRatio,
        resolution: parsed.resolution,
        visual_style: parsed.visualStyle,
        language: parsed.language,
        project_status: "draft",
      })
      .select("*")
      .single();

    if (error || !project) throw new Error(error?.message ?? "Failed creating project");

    await auth.adminSupabase.from("project_settings").insert({
      project_id: project.id,
      user_id: auth.userId,
      visual_style: parsed.visualStyle,
      duration_seconds: parsed.durationSeconds,
      aspect_ratio: parsed.aspectRatio,
      export_resolution: parsed.resolution,
      visual_pacing: parsed.visualPacing,
      character_consistency: parsed.characterConsistency,
      character_instructions: parsed.characterInstructions,
      language: parsed.language,
      voice_id: parsed.voiceId ?? null,
      voice_tone: parsed.voiceTone,
      speech_speed: parsed.speechSpeed,
      ...(parsed.voiceParameters ? { voice_parameters: parsed.voiceParameters } : {}),
      background_music_id: parsed.backgroundMusicId ?? null,
      music_volume: parsed.musicVolume,
      ...(parsed.soundEffects ? { sound_effects: parsed.soundEffects } : {}),
      camera_movements: parsed.cameraMovements,
      transition_style: parsed.transitionStyle,
      ...(parsed.captions ? { captions: parsed.captions } : {}),
      advanced_prompt_instructions: parsed.advancedPromptInstructions,
    });

    return jsonOk(
      {
        project: {
          id: project.id,
          title: project.title,
          status: project.project_status,
          durationSeconds: Number(project.requested_duration_seconds),
          aspectRatio: project.aspect_ratio,
          resolution: project.resolution,
          creditsRequired,
        },
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
