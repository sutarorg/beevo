"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Sparkles,
  ImagePlus,
  CalendarClock,
  Save,
  Send,
  Lock,
  Loader2,
  Check,
  Wand2,
} from "lucide-react";
import { cn, formatDateTime, toLocalInputValue } from "@/lib/utils";
import { api } from "@/lib/api";
import { PLATFORMS, platformById } from "@/lib/constants";
import { Badge, Button, Modal, ProBadge, Select, Textarea } from "@/components/ui/primitives";
import { PlatformChip } from "@/components/brand/platform-icon";
import { useApp } from "@/providers/app-provider";
import type { PlatformId } from "@/lib/types";

const TONES = [
  { value: "playful", label: "Playful" },
  { value: "professional", label: "Professional" },
  { value: "bold", label: "Bold" },
];

export function ComposerModal() {
  const {
    composer,
    closeComposer,
    createPost,
    patchPost,
    media,
    plan,
    openUpgrade,
    aiAssist,
    analytics,
  } = useApp();

  const editing = composer?.options.post ?? null;
  const open = !!composer?.open;

  const [caption, setCaption] = React.useState("");
  const [platforms, setPlatforms] = React.useState<PlatformId[]>([]);
  const [selectedMedia, setSelectedMedia] = React.useState<string[]>([]);
  const [when, setWhen] = React.useState("");
  const [busy, setBusy] = React.useState<"save" | "schedule" | null>(null);
  const [aiBrief, setAiBrief] = React.useState("");
  const [aiTone, setAiTone] = React.useState("playful");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiSuggestions, setAiSuggestions] = React.useState<string[]>([]);
  const [aiUsed, setAiUsed] = React.useState(false);
  const [uploaded, setUploaded] = React.useState<string[]>([]);

  /* hydrate when opened */
  React.useEffect(() => {
    if (!composer?.open) return;
    const p = composer.options.post;
    setCaption(p?.caption ?? "");
    setPlatforms(p?.platforms ?? composer.options.platforms ?? ["instagram"]);
    setSelectedMedia(p?.media ?? composer.options.media ?? []);
    const base =
      p?.scheduledAt ??
      composer.options.date ??
      new Date(Date.now() + 60 * 60 * 1000).toISOString();
    setWhen(toLocalInputValue(base));
    setAiSuggestions([]);
    setAiBrief("");
    setAiUsed(!!p?.aiAssisted);
    setBusy(null);
  }, [composer]);

  const togglePlatform = (id: PlatformId) =>
    setPlatforms((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((p) => p !== id) : prev) : [...prev, id]
    );

  const toggleMedia = (src: string) =>
    setSelectedMedia((prev) => (prev.includes(src) ? prev.filter((m) => m !== src) : [...prev, src]));

  const strictest = platforms.length
    ? Math.min(...platforms.map((p) => platformById(p).charLimit))
    : 2200;
  const overLimit = caption.length > strictest;
  const strictestMeta = platforms.length
    ? platformById(platforms.reduce((a, b) => (platformById(a).charLimit < platformById(b).charLimit ? a : b)))
    : null;

  const best = React.useMemo(() => {
    if (!analytics) return null;
    const top = [...analytics.bestTimes].sort((a, b) => b.score - a.score)[0];
    if (!top) return null;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const slots = ["6–8 am", "8–10 am", "10–12 pm", "12–3 pm", "3–6 pm", "6–9 pm", "9–11 pm"];
    return `${days[top.day]} · ${slots[top.slot]}`;
  }, [analytics]);

  async function runAi() {
    if (plan !== "pro") return openUpgrade("ai");
    setAiLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900)); // simulate thinking
      setAiSuggestions(await aiAssist(aiBrief || caption, aiTone));
    } catch {
      toast.error("The hive mind is busy — try again");
    } finally {
      setAiLoading(false);
    }
  }

  async function submit(status: "draft" | "schedule") {
    if (!caption.trim()) return toast.error("Write a caption first");
    if (platforms.length === 0) return toast.error("Pick at least one platform");
    if (overLimit) return toast.error(`Caption is over the ${strictestMeta?.name} limit`);
    if (status === "schedule" && !when) return toast.error("Choose a date & time");

    setBusy(status === "draft" ? "save" : "schedule");
    try {
      const iso = when ? new Date(when).toISOString() : null;
      if (editing) {
        const updated = await patchPost(editing.id, {
          caption,
          platforms,
          media: selectedMedia,
          scheduledAt: status === "schedule" ? iso : null,
          status: status === "schedule" ? "scheduled" : "draft",
          aiAssisted: aiUsed,
        });
        if (updated) {
          toast.success(status === "schedule" ? `Scheduled for ${formatDateTime(iso!)}` : "Draft updated");
          closeComposer();
        }
      } else {
        const created = await createPost({
          caption,
          platforms,
          media: selectedMedia,
          scheduledAt: status === "schedule" ? iso : null,
          status: status === "schedule" ? "scheduled" : "draft",
          aiAssisted: aiUsed,
        });
        if (created) {
          toast.success(status === "schedule" ? `Scheduled for ${formatDateTime(iso!)}` : "Saved to drafts");
          closeComposer();
        }
      }
    } finally {
      setBusy(null);
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<{ asset: { src: string } }>("/api/media/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploaded((u) => [...u, data.asset.src]);
      setSelectedMedia((m) => [...m, data.asset.src]);
      toast.success("Uploaded to your media library");
    } catch {
      // Graceful fallback when uploads aren't configured (e.g. no Blob storage).
      const url = URL.createObjectURL(file);
      setUploaded((u) => [...u, url]);
      setSelectedMedia((m) => [...m, url]);
      toast.success("Added for this session (configure storage for permanent uploads)");
    }
  }

  const allMedia = [
    ...media.map((m) => ({ src: m.src, label: m.label })),
    ...uploaded.map((src, i) => ({ src, label: `Upload ${i + 1}` })),
  ];

  return (
    <Modal open={open} onClose={closeComposer} size="lg">
      {/* header */}
      <div className="flex items-center justify-between border-b border-cream-300/70 bg-white/70 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey-100 text-honey-700 border border-honey-300/60">
            <Send size={16} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink-950">
              {editing ? "Edit post" : "Compose new post"}
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-600/60">
              {platforms.length} of {PLATFORMS.length} channels selected
            </p>
          </div>
        </div>
        <button onClick={closeComposer} className="cursor-pointer rounded-lg p-1.5 text-ink-600/60 hover:bg-cream-200/70 hover:text-ink-900">
          <X size={18} />
        </button>
      </div>

      <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1fr_310px]">
        {/* left — editor */}
        <div className="space-y-5 px-5 py-5 sm:px-6">
          {/* platforms */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600/90">Publish to</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-all",
                      active
                        ? "border-honey-500/60 bg-honey-50 text-ink-950 shadow-[var(--shadow-card)]"
                        : "border-cream-300 bg-white/60 text-ink-600/70 hover:border-honey-400/50 hover:text-ink-900"
                    )}
                  >
                    <PlatformChip platform={p.id} size={20} active={active} />
                    {p.name}
                    {active && <Check size={13} className="text-honey-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* caption */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600/90">Caption</p>
              <span className={cn("font-mono text-[11px] tnum", overLimit ? "font-bold text-berry-600" : "text-ink-600/60")}>
                {caption.length}/{strictest}
                {strictestMeta && <span className="ml-1 normal-case">({strictestMeta.name})</span>}
              </span>
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={7}
              placeholder="What's the buzz? Write something worth landing on…"
              className={cn("resize-none text-[14px]", overLimit && "border-berry-600/60 focus:border-berry-600 focus:ring-berry-600/10")}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {["#smallbatch", "#beekeeping", "#golden hour"].map((t) => (
                <button
                  key={t}
                  onClick={() => setCaption((c) => (c ? `${c} ${t.replace(" ", "")}` : t.replace(" ", "")))}
                  className="cursor-pointer rounded-full border border-cream-300 bg-white px-2.5 py-1 font-mono text-[11px] text-ink-600/80 transition-colors hover:border-honey-400/60 hover:text-honey-700"
                >
                  {t.replace(" ", "")}
                </button>
              ))}
            </div>
          </div>

          {/* media */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600/90">Media</p>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-honey-700 hover:text-honey-800">
                <ImagePlus size={14} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {allMedia.map((m) => {
                const active = selectedMedia.includes(m.src);
                return (
                  <button
                    key={m.src}
                    onClick={() => toggleMedia(m.src)}
                    className={cn(
                      "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all",
                      active ? "border-honey-500 shadow-[var(--shadow-gold)]" : "border-transparent hover:border-honey-300"
                    )}
                    title={m.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.src} alt={m.label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    {active && (
                      <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-honey-500 text-ink-950">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cream-300 text-ink-600/50 transition-colors hover:border-honey-400/70 hover:text-honey-700">
                <ImagePlus size={18} />
                <span className="text-[10px] font-medium">Add</span>
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </label>
            </div>
          </div>

          {/* schedule */}
          <div className="rounded-2xl border border-cream-300 bg-white/70 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600/90">
                  Schedule for
                </p>
                <input
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="h-10 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-900 transition-colors hover:border-honey-400/60 focus:border-honey-500 focus:outline-none focus:ring-4 focus:ring-honey-500/15"
                />
              </div>
              <div className="pb-0.5">
                {plan === "pro" ? (
                  best && (
                    <Badge tone="gold" className="!py-1.5">
                      <Sparkles size={11} /> Best time: {best}
                    </Badge>
                  )
                ) : (
                  <button onClick={() => openUpgrade("best-time")} className="cursor-pointer">
                    <Badge tone="outline" className="!py-1.5 hover:border-honey-400">
                      <Lock size={10} /> Best-time engine <ProBadge />
                    </Badge>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* right — AI assistant */}
        <aside className="border-t border-cream-300/70 bg-honey-50/40 px-5 py-5 lg:border-l lg:border-t-0 comb-light">
          <div className="flex items-center gap-2">
            <Wand2 size={15} className="text-honey-700" />
            <p className="text-[13px] font-semibold text-ink-950">AI caption assistant</p>
            <ProBadge />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-600/80">
            Describe the post and the hive writes three on-brand captions for you.
          </p>

          {plan === "pro" ? (
            <div className="mt-4 space-y-3">
              <Textarea
                rows={3}
                value={aiBrief}
                onChange={(e) => setAiBrief(e.target.value)}
                placeholder="e.g. Batch 42 wildflower honey drops Friday, 200 jars only…"
                className="resize-none !bg-white text-[13px]"
              />
              <div className="flex gap-2">
                <Select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className="!h-9 text-[13px]">
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="dark" onClick={runAi} busy={aiLoading} className="shrink-0 !h-9">
                  <Sparkles size={13} /> Generate
                </Button>
              </div>

              <div className="space-y-2">
                {aiLoading &&
                  [0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-[74px] rounded-xl" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                {!aiLoading &&
                  aiSuggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => {
                        setCaption(s);
                        setAiUsed(true);
                        toast.success("Caption applied");
                      }}
                      className="block w-full cursor-pointer rounded-xl border border-cream-300 bg-white p-3 text-left text-[12.5px] leading-relaxed text-ink-700 transition-all hover:border-honey-500/60 hover:shadow-[var(--shadow-card)]"
                    >
                      {s}
                      <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wide text-honey-700">
                        Click to use →
                      </span>
                    </motion.button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="relative mt-4">
              <div className="space-y-2 blur-[5px] select-none pointer-events-none" aria-hidden>
                {["Golden hour hits different when the jar is still warm…", "POV: 7:04 am, the toast is perfect…", "One jar = 1.2 million flower visits…"].map((t, i) => (
                  <div key={i} className="rounded-xl border border-cream-300 bg-white p-3 text-[12.5px] leading-relaxed text-ink-700">
                    {t}
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-honey-400">
                  <Lock size={15} />
                </span>
                <p className="text-xs font-semibold text-ink-900">Unlock Hive Writer</p>
                <Button size="sm" onClick={() => openUpgrade("ai")}>
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-cream-300/70 bg-white/70 px-5 py-4 sm:px-6">
        <Button variant="ghost" size="sm" busy={busy === "save"} onClick={() => submit("draft")}>
          <Save size={14} /> {editing ? "Update draft" : "Save as draft"}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {overLimit && <span className="text-xs font-medium text-berry-600">Over {strictestMeta?.name} limit</span>}
          <Button busy={busy === "schedule"} onClick={() => submit("schedule")} disabled={overLimit}>
            <CalendarClock size={15} />
            {editing ? "Update & schedule" : when ? `Schedule · ${new Date(when).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Schedule post"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
