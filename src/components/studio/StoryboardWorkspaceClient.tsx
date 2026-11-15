"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Layers,
  Palette,
  PanelRight,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { StoryboardScene, TransitionOption } from "@/lib/app-types";

interface StoryboardWorkspaceClientProps {
  projectId: string;
}

const EMPTY_STYLE_BIBLE = {
  mainArtDirection: "",
  colorPalette: "",
  characterDescriptions: "",
  environmentDescriptions: "",
  visualConsistencyInstructions: "",
};

function createBlankScene(orderIndex: number): StoryboardScene {
  return {
    id: `local-scene-${Date.now()}-${orderIndex}`,
    orderIndex,
    narrationText: "",
    visualDescription: "",
    imagePrompt: "",
    characterRefs: [],
    composition: "Medium shot",
    cameraInstruction: "Slow zoom",
    emotion: "Warm & curious",
    transition: "crossfade",
    imageStatus: "planned",
    imageUrl: null,
  };
}

export function StoryboardWorkspaceClient({ projectId }: StoryboardWorkspaceClientProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [styleBible, setStyleBible] = useState(EMPTY_STYLE_BIBLE);
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [activeCanvasTab, setActiveCanvasTab] = useState<"scenes" | "script" | "bible">("scenes");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId) ?? scenes[0] ?? null;

  const handleAddScene = () => {
    const next = createBlankScene(scenes.length + 1);
    setScenes((prev) => [...prev, next]);
    setSelectedSceneId(next.id);
    setActiveCanvasTab("scenes");
    setActionNotice(null);
  };

  const handleDeleteScene = (id: string) => {
    setScenes((prev) => {
      const filtered = prev
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, orderIndex: idx + 1 }));
      if (selectedSceneId === id) {
        setSelectedSceneId(filtered[0]?.id ?? null);
      }
      return filtered;
    });
  };

  const handleMoveScene = (id: string, direction: "up" | "down") => {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next.map((scene, i) => ({ ...scene, orderIndex: i + 1 }));
    });
  };

  const handleUpdateScene = (id: string, patch: Partial<StoryboardScene>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const triggerBackendNotice = (actionLabel: string) => {
    setActionNotice(
      `"${actionLabel}" requires connected OpenAI, fal.ai, and Supabase backend services, which wire up in Phase 4. Your local storyboard edits stay in this browser session without creating fake generated assets.`
    );
  };

  const renderInspectorContent = () => {
    if (!selectedScene) {
      return (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-dashed border-beevo-border-warm bg-beevo-cream/45 p-4 text-center">
            <Layers className="mx-auto h-6 w-6 text-beevo-honey-text" aria-hidden="true" />
            <p className="mt-2 text-[13.5px] font-bold text-beevo-ink">No scene selected</p>
            <p className="mt-1 text-[12px] leading-relaxed text-beevo-muted">
              Add a blank scene or open a backend-synced project in Phase 4 to inspect camera
              framing, image prompt, transitions, and character references.
            </p>
          </div>

          <div className="rounded-[16px] border border-beevo-border bg-beevo-canvas p-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
              <h3 className="font-display text-[13.5px] font-extrabold text-beevo-ink">
                Character References
              </h3>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-beevo-muted">
              No character sheets generated yet. Generated or uploaded character references appear
              here with status badges once Phase 4 connects fal.ai storage.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-beevo-cream px-3 py-1 text-[12px] font-extrabold text-beevo-ink">
            Scene {selectedScene.orderIndex} Properties
          </span>
          <span className="rounded-full border border-beevo-border bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-beevo-muted">
            {selectedScene.imageStatus}
          </span>
        </div>

        {/* Scene Frame Status Box (Honest Pending Label — NEVER fake artwork) */}
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-[14px] border border-dashed border-beevo-border-warm bg-beevo-cream/45 px-4 text-center">
          <ImageIcon className="h-6 w-6 text-beevo-honey-text" aria-hidden="true" />
          <p className="mt-1.5 text-[12.5px] font-bold text-beevo-ink">
            Image planned &middot; Pending render
          </p>
          <p className="mt-0.5 text-[11.5px] text-beevo-muted">
            Real fal.ai frame renders after storyboard approval.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="insp-narration"
              className="block text-[12px] font-bold text-beevo-ink"
            >
              Scene Narration
            </label>
            <textarea
              id="insp-narration"
              rows={3}
              value={selectedScene.narrationText}
              onChange={(e) =>
                handleUpdateScene(selectedScene.id, { narrationText: e.target.value })
              }
              placeholder="Write the spoken line for this scene..."
              className="mt-1 w-full rounded-[10px] border border-beevo-border bg-white p-2.5 text-[13px] text-beevo-ink placeholder:text-beevo-muted/65"
            />
          </div>

          <div>
            <label htmlFor="insp-visual" className="block text-[12px] font-bold text-beevo-ink">
              Visual Description
            </label>
            <textarea
              id="insp-visual"
              rows={2}
              value={selectedScene.visualDescription}
              onChange={(e) =>
                handleUpdateScene(selectedScene.id, { visualDescription: e.target.value })
              }
              placeholder="Describe what happens visually in this frame..."
              className="mt-1 w-full rounded-[10px] border border-beevo-border bg-white p-2.5 text-[13px] text-beevo-ink placeholder:text-beevo-muted/65"
            />
          </div>

          <div>
            <label htmlFor="insp-prompt" className="block text-[12px] font-bold text-beevo-ink">
              Image Prompt
            </label>
            <textarea
              id="insp-prompt"
              rows={2}
              value={selectedScene.imagePrompt}
              onChange={(e) =>
                handleUpdateScene(selectedScene.id, { imagePrompt: e.target.value })
              }
              placeholder="Detailed illustration prompt for fal.ai..."
              className="mt-1 w-full rounded-[10px] border border-beevo-border bg-white p-2.5 text-[13px] text-beevo-ink placeholder:text-beevo-muted/65"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="insp-composition"
                className="block text-[12px] font-bold text-beevo-ink"
              >
                Composition
              </label>
              <input
                id="insp-composition"
                type="text"
                value={selectedScene.composition}
                onChange={(e) =>
                  handleUpdateScene(selectedScene.id, { composition: e.target.value })
                }
                className="mt-1 min-h-[40px] w-full rounded-[10px] border border-beevo-border bg-white px-2.5 text-[12.5px] text-beevo-ink"
              />
            </div>

            <div>
              <label htmlFor="insp-emotion" className="block text-[12px] font-bold text-beevo-ink">
                Emotion / Mood
              </label>
              <input
                id="insp-emotion"
                type="text"
                value={selectedScene.emotion}
                onChange={(e) =>
                  handleUpdateScene(selectedScene.id, { emotion: e.target.value })
                }
                className="mt-1 min-h-[40px] w-full rounded-[10px] border border-beevo-border bg-white px-2.5 text-[12.5px] text-beevo-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="insp-camera" className="block text-[12px] font-bold text-beevo-ink">
                Camera Motion
              </label>
              <input
                id="insp-camera"
                type="text"
                value={selectedScene.cameraInstruction}
                onChange={(e) =>
                  handleUpdateScene(selectedScene.id, { cameraInstruction: e.target.value })
                }
                className="mt-1 min-h-[40px] w-full rounded-[10px] border border-beevo-border bg-white px-2.5 text-[12.5px] text-beevo-ink"
              />
            </div>

            <div>
              <label
                htmlFor="insp-transition"
                className="block text-[12px] font-bold text-beevo-ink"
              >
                Transition
              </label>
              <select
                id="insp-transition"
                value={selectedScene.transition}
                onChange={(e) =>
                  handleUpdateScene(selectedScene.id, {
                    transition: e.target.value as TransitionOption,
                  })
                }
                className="mt-1 min-h-[40px] w-full rounded-[10px] border border-beevo-border bg-white px-2 text-[12.5px] font-semibold text-beevo-ink"
              >
                <option value="automatic">Automatic</option>
                <option value="crossfade">Crossfade</option>
                <option value="zoom">Zoom</option>
                <option value="slide">Slide</option>
                <option value="cut">Cut</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => triggerBackendNotice(`Regenerate Scene ${selectedScene.orderIndex}`)}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-full border border-beevo-border bg-white px-3 text-[12px] font-bold text-beevo-ink hover:bg-beevo-cream"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Regen Scene
            </button>
            <button
              type="button"
              onClick={() =>
                triggerBackendNotice(`Regenerate Image for Scene ${selectedScene.orderIndex}`)
              }
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-full border border-beevo-border bg-white px-3 text-[12px] font-bold text-beevo-ink hover:bg-beevo-cream"
            >
              <Sparkles className="h-3.5 w-3.5 text-beevo-honey-text" aria-hidden="true" />
              Regen Image
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Workspace Header Bar */}
      <header className="rounded-[22px] border border-beevo-border bg-white p-4 shadow-beevo-card sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow showSparkle>Storyboard Review</Eyebrow>
              <span className="rounded-full border border-beevo-border bg-beevo-canvas px-2.5 py-0.5 text-[11px] font-bold text-beevo-muted">
                Project: {projectId}
              </span>
              <span className="rounded-full bg-beevo-cream px-2.5 py-0.5 text-[11px] font-bold text-beevo-honey-text">
                {scenes.length} {scenes.length === 1 ? "scene" : "scenes"} planned
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <label htmlFor="storyboard-project-title" className="sr-only">
                Project Title
              </label>
              <input
                id="storyboard-project-title"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Untitled Storyboard Project"
                className="w-full max-w-md rounded-[10px] border border-transparent bg-transparent px-1 font-display text-[22px] font-extrabold tracking-[-0.02em] text-beevo-ink placeholder:text-beevo-ink/50 hover:border-beevo-border focus:border-beevo-ink focus:bg-beevo-canvas sm:text-[25px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setInspectorOpen((prev) => !prev)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-beevo-border bg-white px-4 text-[13px] font-bold text-beevo-ink hover:bg-beevo-cream xl:hidden"
            >
              <PanelRight className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
              Inspector
            </button>
            <button
              type="button"
              onClick={handleAddScene}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-beevo-border bg-beevo-canvas px-4 text-[13px] font-bold text-beevo-ink hover:bg-beevo-cream"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Scene
            </button>
            <button
              type="button"
              onClick={() => triggerBackendNotice("Approve Storyboard & Start Generation")}
              className="beevo-btn-primary min-h-[44px] px-5 text-[13.5px]"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approve Storyboard
            </button>
          </div>
        </div>

        {actionNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-start justify-between gap-3 rounded-[14px] border border-beevo-border-warm bg-beevo-cream/85 p-3.5 text-[13px] leading-relaxed text-beevo-body"
          >
            <div className="flex items-start gap-2.5">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-beevo-honey-text"
                aria-hidden="true"
              />
              <span>{actionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              aria-label="Dismiss notice"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-beevo-muted hover:bg-white hover:text-beevo-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      {/* 3-Pane Desktop Studio Layout / Responsive Tablet & Mobile */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* LEFT PANE: Scene Outline & Quick Navigation (Desktop >= 1280px) */}
        <aside
          aria-label="Storyboard outline"
          className="hidden xl:col-span-3 xl:block"
        >
          <div className="sticky top-[88px] space-y-4 rounded-[22px] border border-beevo-border bg-white p-4 shadow-beevo-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[14.5px] font-extrabold text-beevo-ink">
                Workspace Sections
              </h2>
              <span className="text-[11.5px] font-bold text-beevo-muted tabular-nums">
                {scenes.length} scenes
              </span>
            </div>

            <div className="space-y-1.5">
              {(
                [
                  { id: "scenes", label: "Dynamic Scene List", icon: Layers },
                  { id: "script", label: "Script Editor", icon: BookOpen },
                  { id: "bible", label: "Visual Style Bible", icon: Palette },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeCanvasTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCanvasTab(tab.id)}
                    className={`flex min-h-[42px] w-full items-center gap-2.5 rounded-[12px] px-3 text-[13px] font-bold transition-colors ${
                      active
                        ? "border border-beevo-border-warm bg-beevo-cream text-beevo-ink"
                        : "text-beevo-body hover:bg-beevo-canvas"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-beevo-honey-text" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-beevo-border pt-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-beevo-muted">
                  Scene Outline
                </span>
                <button
                  type="button"
                  onClick={handleAddScene}
                  className="text-[12px] font-bold text-beevo-honey-text hover:underline"
                >
                  + Add
                </button>
              </div>

              {scenes.length === 0 ? (
                <p className="mt-2.5 rounded-[12px] bg-beevo-canvas p-3 text-[12px] leading-relaxed text-beevo-muted">
                  No scenes planned yet. Click &ldquo;Add Scene&rdquo; to draft locally or generate
                  from Creation Studio once Phase 4 connects.
                </p>
              ) : (
                <ul className="mt-2.5 space-y-1.5">
                  {scenes.map((scene) => {
                    const active = selectedScene?.id === scene.id;
                    return (
                      <li key={scene.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSceneId(scene.id);
                            setActiveCanvasTab("scenes");
                          }}
                          className={`flex min-h-[42px] w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[12.5px] transition-colors ${
                            active
                              ? "bg-beevo-dark font-bold text-[#FFFDF7]"
                              : "bg-beevo-canvas font-semibold text-beevo-body hover:bg-beevo-cream"
                          }`}
                        >
                          <span className="truncate">
                            Scene {scene.orderIndex}
                            {scene.narrationText ? ` · ${scene.narrationText}` : " · Empty draft"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </aside>

        {/* CENTER CANVAS: Tabs + Script / Style Bible / Dynamic Scene Cards */}
        <div className="space-y-5 xl:col-span-6">
          {/* Mobile / Tablet Section Switcher */}
          <div
            role="tablist"
            aria-label="Storyboard workspace views"
            className="grid grid-cols-3 gap-1.5 rounded-[16px] border border-beevo-border bg-white p-1.5 shadow-sm xl:hidden"
          >
            {(
              [
                { id: "scenes", label: `Scenes (${scenes.length})` },
                { id: "script", label: "Script" },
                { id: "bible", label: "Style Bible" },
              ] as const
            ).map((tab) => {
              const active = activeCanvasTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCanvasTab(tab.id)}
                  className={`min-h-[42px] rounded-[11px] px-2 text-[12.5px] font-extrabold transition-colors ${
                    active ? "bg-[#FFC928] text-beevo-ink shadow-sm" : "text-beevo-muted"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* SCRIPT PANEL */}
          {activeCanvasTab === "script" && (
            <section className="rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-[18px] font-extrabold text-beevo-ink">
                    Full Narration Script
                  </h2>
                  <p className="text-[12.5px] text-beevo-muted">
                    Review and polish spoken narration before generating voiceover and scenes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerBackendNotice("Regenerate Full Script")}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-beevo-border bg-beevo-canvas px-4 text-[12.5px] font-bold text-beevo-ink hover:bg-beevo-cream"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Regenerate Script
                </button>
              </div>
              <textarea
                rows={12}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                aria-label="Full narration script"
                placeholder="No script loaded from backend for this project ID yet. You can draft or paste a narration script here..."
                className="mt-4 w-full rounded-[14px] border border-beevo-border bg-beevo-canvas p-4 text-[14.5px] leading-[1.7] text-beevo-ink placeholder:text-beevo-muted/65 focus:border-beevo-ink"
              />
              <p className="mt-2.5 text-[12px] text-beevo-muted">
                {scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0} words &middot;
                Changes stay in local draft until Phase 4 connects Supabase persistence.
              </p>
            </section>
          )}

          {/* VISUAL STYLE BIBLE PANEL */}
          {activeCanvasTab === "bible" && (
            <section className="space-y-4 rounded-[22px] border border-beevo-border bg-white p-5 shadow-beevo-card">
              <div>
                <h2 className="font-display text-[18px] font-extrabold text-beevo-ink">
                  Visual Style Bible
                </h2>
                <p className="text-[12.5px] text-beevo-muted">
                  Locked direction shared across every generated character sheet and scene prompt.
                </p>
              </div>

              <div className="space-y-3.5">
                {(
                  [
                    {
                      key: "mainArtDirection",
                      label: "Main Art Direction",
                      placeholder: "Illustration medium, linework, lighting, and overall mood...",
                    },
                    {
                      key: "colorPalette",
                      label: "Color Palette Notes",
                      placeholder: "Primary warm tones, accents, sky/background mood...",
                    },
                    {
                      key: "characterDescriptions",
                      label: "Character Descriptions",
                      placeholder: "Lead and supporting cast wardrobe, proportions, expressions...",
                    },
                    {
                      key: "environmentDescriptions",
                      label: "Environment & Setting Descriptions",
                      placeholder: "Recurring locations, props, architecture, foliage...",
                    },
                    {
                      key: "visualConsistencyInstructions",
                      label: "Visual Consistency Instructions",
                      placeholder: "Rules to enforce across all generated frames...",
                    },
                  ] as const
                ).map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`bible-${field.key}`}
                      className="block text-[13px] font-bold text-beevo-ink"
                    >
                      {field.label}
                    </label>
                    <textarea
                      id={`bible-${field.key}`}
                      rows={2}
                      value={styleBible[field.key]}
                      onChange={(e) =>
                        setStyleBible((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="mt-1.5 w-full rounded-[12px] border border-beevo-border bg-beevo-canvas p-3 text-[13.5px] text-beevo-ink placeholder:text-beevo-muted/65"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* DYNAMIC SCENE LIST PANEL */}
          {activeCanvasTab === "scenes" && (
            <section aria-label="Dynamic storyboard scenes" className="space-y-4">
              {scenes.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-beevo-border-warm bg-white p-6 text-center shadow-beevo-card sm:p-10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-beevo-cream text-beevo-honey-text">
                    <Layers className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-[20px] font-extrabold tracking-[-0.02em] text-beevo-ink">
                    No storyboard scenes generated for this project yet
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-beevo-body">
                    When Phase 4 connects OpenAI &amp; Supabase, Beevo automatically breaks your
                    approved idea into a dynamic number of illustrated scenes. Right now, you can
                    add blank scenes manually to test editing, reordering, and inspection.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddScene}
                      className="beevo-btn-primary min-h-[46px] px-5 text-[14px]"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add Blank Scene
                    </button>
                    <Link
                      href="/app/create"
                      className="beevo-btn-secondary min-h-[46px] px-5 text-[14px]"
                    >
                      Back to Creation Studio
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {scenes.map((scene, idx) => {
                    const isSelected = selectedScene?.id === scene.id;
                    return (
                      <article
                        key={scene.id}
                        className={`rounded-[20px] border bg-white p-4 shadow-beevo-card transition-all sm:p-5 ${
                          isSelected
                            ? "border-2 border-beevo-yellow ring-2 ring-[#FFC928]/25"
                            : "border-beevo-border hover:border-beevo-border-warm"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-beevo-dark px-2.5 text-[12px] font-extrabold text-[#FFFDF7]">
                              {scene.orderIndex}
                            </span>
                            <span className="font-display text-[15px] font-extrabold text-beevo-ink">
                              Scene {scene.orderIndex}
                            </span>
                            <span className="rounded-full bg-beevo-cream px-2.5 py-0.5 text-[11px] font-bold uppercase text-beevo-honey-text">
                              {scene.imageStatus === "planned"
                                ? "Planned · Image pending"
                                : scene.imageStatus}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveScene(scene.id, "up")}
                              disabled={idx === 0}
                              aria-label={`Move Scene ${scene.orderIndex} up`}
                              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-beevo-border bg-beevo-canvas text-beevo-ink hover:bg-beevo-cream disabled:opacity-35"
                            >
                              <ArrowUp className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveScene(scene.id, "down")}
                              disabled={idx === scenes.length - 1}
                              aria-label={`Move Scene ${scene.orderIndex} down`}
                              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-beevo-border bg-beevo-canvas text-beevo-ink hover:bg-beevo-cream disabled:opacity-35"
                            >
                              <ArrowDown className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSceneId(scene.id);
                                setMobileSheetOpen(true);
                              }}
                              aria-label={`Edit Scene ${scene.orderIndex}`}
                              className="inline-flex h-[38px] items-center gap-1 rounded-lg border border-beevo-border bg-white px-2.5 text-[12px] font-bold text-beevo-ink hover:bg-beevo-cream"
                            >
                              <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteScene(scene.id)}
                              aria-label={`Delete Scene ${scene.orderIndex}`}
                              className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-beevo-border bg-white text-beevo-muted hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-12">
                          {/* Honest Pending Frame Box */}
                          <button
                            type="button"
                            onClick={() => setSelectedSceneId(scene.id)}
                            className="flex aspect-video flex-col items-center justify-center rounded-[14px] border border-dashed border-beevo-border-warm bg-beevo-cream/40 px-3 text-center sm:col-span-5"
                          >
                            <ImageIcon
                              className="h-5 w-5 text-beevo-honey-text"
                              aria-hidden="true"
                            />
                            <span className="mt-1 text-[12px] font-bold text-beevo-ink">
                              Planned Frame
                            </span>
                            <span className="text-[11px] text-beevo-muted">
                              Pending fal.ai render
                            </span>
                          </button>

                          {/* Quick Scene Fields */}
                          <div className="space-y-2.5 sm:col-span-7">
                            <div>
                              <label
                                htmlFor={`scene-narration-${scene.id}`}
                                className="block text-[11.5px] font-bold uppercase tracking-wide text-beevo-muted"
                              >
                                Narration Text
                              </label>
                              <textarea
                                id={`scene-narration-${scene.id}`}
                                rows={2}
                                value={scene.narrationText}
                                onFocus={() => setSelectedSceneId(scene.id)}
                                onChange={(e) =>
                                  handleUpdateScene(scene.id, { narrationText: e.target.value })
                                }
                                placeholder="Spoken narration for this scene..."
                                className="mt-1 w-full rounded-[10px] border border-beevo-border bg-beevo-canvas p-2.5 text-[13px] text-beevo-ink placeholder:text-beevo-muted/65"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-semibold text-beevo-muted">
                              <span className="rounded-full bg-beevo-canvas px-2.5 py-0.5">
                                {scene.composition}
                              </span>
                              <span className="rounded-full bg-beevo-canvas px-2.5 py-0.5">
                                {scene.cameraInstruction}
                              </span>
                              <span className="rounded-full bg-beevo-canvas px-2.5 py-0.5 capitalize">
                                Transition: {scene.transition}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        {/* RIGHT PANE: Scene Properties & Character Refs Inspector (Desktop >= 1280px) */}
        <aside
          aria-label="Scene properties inspector"
          className="hidden xl:col-span-3 xl:block"
        >
          <div className="sticky top-[88px] rounded-[22px] border border-beevo-border bg-white p-4 shadow-beevo-card">
            <h2 className="mb-3 font-display text-[15px] font-extrabold text-beevo-ink">
              Scene Inspector
            </h2>
            {renderInspectorContent()}
          </div>
        </aside>
      </div>

      {/* Tablet / Mobile Collapsible Inspector Drawer / Bottom Sheet */}
      {(inspectorOpen || mobileSheetOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Scene editor inspector"
        >
          <div
            className="fixed inset-0 bg-[#1B1916]/45 backdrop-blur-[2px]"
            onClick={() => {
              setInspectorOpen(false);
              setMobileSheetOpen(false);
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-[24px] bg-[#FFFEFB] p-5 shadow-2xl md:h-full md:max-h-full md:w-[390px] md:rounded-l-[24px] md:rounded-tr-none">
            <div className="mb-4 flex items-center justify-between border-b border-beevo-border pb-3">
              <h2 className="font-display text-[16px] font-extrabold text-beevo-ink">
                Scene Properties &amp; References
              </h2>
              <button
                type="button"
                onClick={() => {
                  setInspectorOpen(false);
                  setMobileSheetOpen(false);
                }}
                aria-label="Close scene inspector"
                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-beevo-border bg-white text-beevo-ink hover:bg-beevo-cream"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {renderInspectorContent()}
          </div>
        </div>
      )}
    </div>
  );
}
