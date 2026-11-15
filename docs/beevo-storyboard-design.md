# Beevo Storyboard Review Workspace Design

**Route:** `/app/projects/[id]/storyboard`  
**Component:** `src/components/app/StoryboardWorkspaceClient.tsx`

---

## 1. Creative Purpose
The Storyboard Review Workspace bridges raw ideation (`/app/create`) and GPU/render execution (`/app/generations/[id]`). It gives creators a calm, studio-grade editorial space to review the OpenAI-generated script, inspect the Visual Style Bible, refine individual scene prompts and camera directions, and approve the final dynamic scene list before rendering begins.

## 2. Adaptive Multi-Device Layout

### Desktop (`>= 1200px`) — Classic 3-Pane Creative Studio
- **Left Pane (`236px`):** Project navigation & storyboard section jump list (`Script Panel`, `Visual Style Bible`, `Dynamic Scenes`, `Character References`) plus clickable numbered scene index.
- **Center Pane (`flex-1`):** Spacious vertical workspace featuring:
  1. Honest backend status banner (distinguishing real synced database records from local Phase 2 draft edits)
  2. Editable **Script Panel** with language label, live word count, estimated spoken runtime (`~135 wpm`), and explicit `Save Script Changes` control
  3. **Visual Style Bible** panel (Main Art Direction, Color Palette, Character Descriptions, Environment Descriptions, Visual Consistency Instructions)
  4. **Dynamic Storyboard Canvas** — spacious scene cards showing Scene Number, Visual Frame slot (real generated image if present, or crisp `Planned · Image pending generation` badge), Narration text, Visual description, Composition, Camera instruction, Emotion, Transition, and inline Move Up / Move Down / Remove controls
- **Right Pane (`328px`):** Sticky **Scene Properties Inspector & Character References** panel bound to the currently selected scene, allowing full editing of Narration, Visual Description, Image Prompt, Character References, Composition, Camera Instruction, Emotion, and Transition.

### Tablet (`768px – 1199px`)
- Left outline compacts into clean horizontal section pills above the central storyboard canvas.
- Right Scene Properties panel collapses into an accessible slide-over **Scene Inspector Drawer** opened by tapping any scene's `Edit Properties` button.

### Mobile (`320px – 767px`)
- Focused single-column vertical scene stack with generous tap targets (`>= 44×44 px`).
- Tapping a scene opens an accessible full-screen / bottom-sheet **Scene Properties Editor** (`role="dialog"`, `aria-modal="true"`, `Escape` & close button).

## 3. Dynamic Scene Count Architecture
- Scene count is **strictly dynamic**—never clamped to a fixed 4, 6, or 10 scenes.
- Every scene maps to a `StoryboardScene` record (`id`, `orderIndex`, `narrationText`, `visualDescription`, `imagePrompt`, `characterRefs`, `composition`, `cameraInstruction`, `emotion`, `transition`, `imageStatus: "planned" | "pending" | "generated" | "failed"`, `imageUrl`).
- Supported interactive actions:
  - Edit script & save changes
  - Add scene (appends a new `planned` scene cleanly)
  - Edit narration & visual instructions per scene
  - Remove scene
  - Reorder scenes (Move Up / Move Down with keyboard-accessible buttons)
  - Regenerate storyboard (invokes Phase 4 OpenAI Storyboard endpoint; shows honest backend-pending dialog in Phase 2)
  - Approve storyboard (locks scene list and hands off to `/app/generations/[id]`; shows honest backend-pending dialog in Phase 2)

## 4. Strict Image Honesty Rule
Any scene where `imageUrl === null` MUST clearly display **`Planned · Image pending generation`** inside a clean aspect-matched architectural frame—never a stock photo, mock frame, or placeholder cartoon pretending to have been generated for that scene.
