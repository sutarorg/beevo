"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ImagePlus, Search, Send, Images, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";
import { Button, Input, Skeleton } from "@/components/ui/primitives";
import { useApp } from "@/providers/app-provider";

export default function MediaPage() {
  const { ready, media, openComposer, refreshAll } = useApp();
  const [query, setQuery] = React.useState("");
  const [tag, setTag] = React.useState<string>("all");
  const [uploads, setUploads] = React.useState<{ src: string; label: string; tags: string[]; usedIn: number }[]>([]);

  const tags = React.useMemo(
    () => ["all", ...new Set(media.flatMap((m) => m.tags.map((t) => t.trim())))],
    [media]
  );

  const items = React.useMemo(() => {
    const base = [
      ...uploads.map((u, i) => ({ id: `up_${i}`, src: u.src, label: u.label, tags: u.tags, usedIn: u.usedIn })),
      ...media,
    ];
    const q = query.trim().toLowerCase();
    return base.filter(
      (m) =>
        (tag === "all" || m.tags.some((t) => t.trim() === tag)) &&
        (q ? m.label.toLowerCase().includes(q) : true)
    );
  }, [media, uploads, query, tag]);

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
      setUploads((u) => [{ src: data.asset.src, label: file.name.replace(/\.[^.]+$/, ""), tags: ["upload"], usedIn: 0 }, ...u]);
      toast.success("Uploaded to your media library");
      await refreshAll();
    } catch (err) {
      const url = URL.createObjectURL(file);
      setUploads((u) => [{ src: url, label: file.name.replace(/\.[^.]+$/, ""), tags: ["upload"], usedIn: 0 }, ...u]);
      toast.success(`Kept for this session — ${getErrorMessage(err)}`);
    }
  }

  if (!ready)
    return (
      <div className="mx-auto max-w-6xl grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/45" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media…" className="!h-9.5 w-52 !pl-8.5" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Tags size={13} className="text-ink-600/50" />
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={cn(
                "cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                tag === t
                  ? "border-honey-500/60 bg-honey-100 text-honey-800"
                  : "border-cream-300 bg-white/70 text-ink-600/70 hover:border-honey-400/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="ml-auto inline-flex cursor-pointer">
          <span className="inline-flex h-8.5 items-center gap-2 rounded-xl border border-honey-600/30 bg-gradient-to-b from-honey-300 to-honey-500 px-3.5 text-[13px] font-semibold text-ink-950 shadow-[var(--shadow-gold)] transition-all hover:brightness-105 active:scale-[0.98]">
            <ImagePlus size={15} /> Upload
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m, i) => (
          <motion.figure
            key={m.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-cream-300 bg-cream-200 shadow-[var(--shadow-card)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.src} alt={m.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <figcaption className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent p-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="text-[13px] font-semibold text-cream-50">{m.label}</p>
              <p className="mt-0.5 font-mono text-[10px] text-cream-50/70">
                used in {m.usedIn} post{m.usedIn === 1 ? "" : "s"}
              </p>
              <div className="mt-2 flex gap-1.5">
                <Button size="xs" onClick={() => openComposer({ media: [m.src] })}>
                  <Send size={11} /> Use in post
                </Button>
              </div>
            </figcaption>
            <span className="absolute left-2.5 top-2.5 rounded-full bg-ink-950/70 px-2 py-0.5 font-mono text-[9.5px] text-honey-300 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              {m.tags.map((t) => `#${t.trim()}`).join(" ")}
            </span>
          </motion.figure>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50/50 text-ink-600/50 transition-colors hover:border-honey-400/70 hover:text-honey-700 comb-light">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-honey-100 text-honey-700 border border-honey-300/60">
            <ImagePlus size={18} />
          </span>
          <span className="text-xs font-medium">Drop or browse</span>
          <span className="font-mono text-[9.5px] uppercase tracking-wider opacity-60">PNG · JPG · MP4 ≤ 50MB</span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Images size={22} className="text-ink-600/40" />
          <p className="text-sm text-ink-600/70">No media matches “{query}”.</p>
        </div>
      )}
    </div>
  );
}
