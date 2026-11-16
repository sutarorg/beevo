# Beevo Story & Dynamic Storyboard Engine

**Implementation:** `src/lib/openai/client.ts` & `src/features/story-engine/service.ts`

## 1. OpenAI Responses API + Strict Structured Outputs

Beevo uses the official `openai` Node SDK calling `client.responses.create` with `text.format.type = "json_schema"` and `strict: true` (`additionalProperties: false`, every property explicitly listed in `required`).

- **Script Generation (`generateBeevoScript`):** Defaults to `OPENAI_STORY_MODEL=gpt-4o-mini`. Produces clean spoken prose (`fullScript`), title, opening hook, narrative arc, and estimated word/speaking length tailored to requested language, audience, cartoon style, and duration—explicitly forbidding bracketed stage directions or repetitive filler.
- **Dynamic Storyboard & Visual Style Bible (`generateBeevoDynamicStoryboard`):** Defaults to `OPENAI_STORYBOARD_MODEL=gpt-4o`. Produces:
  1. `visualStyleBible`: Color palette, art direction, character appearance rules, background style, lighting style, proportions, camera language, and consistency rules.
  2. `characters[]`: Distinct character codes, names, descriptions, visual identities, and appearance instructions.
  3. `scenes[]`: A **dynamically sized** array of visual narrative beats (zero fixed scene count, zero fixed per-minute quota) with exact `narrationText`, `imagePrompt`, `characterReferences`, `location`, `composition`, `characterPose`, `characterExpression`, `lighting`, `cameraInstruction`, `captionKeywords`, and `transitionInstruction`.

## 2. Deterministic Storyboard Validation (`validateDynamicStoryboard`)

Before accepting any generated storyboard into PostgreSQL:
- Verifies `scenes.length >= 1` and `scenes.length <= maxScenes` (configurable in `system_configuration`, default `160`—hard-fails rather than silently dropping scenes).
- Computes normalized word coverage between the approved script and concatenated `scene.narrationText` (rejects storyboards dropping >25% of spoken narration).
- Flags undeclared character codes and duplicate image prompts for review.
- Records exact `inputTokens`, `outputTokens`, and estimated USD/INR expenditure into `provider_usage`.
