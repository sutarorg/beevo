"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { BeeMark, HexCell } from "@/components/brand/bee-mark";
import { PlatformChip } from "@/components/brand/platform-icon";
import { Badge } from "@/components/ui/primitives";

/**
 * A stylised product snapshot that floats over the landing hero —
 * pure CSS/motion, no screenshots needed.
 */
export function HeroBoard() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* floating decorations */}
      <motion.div
        className="absolute -left-10 top-10 hidden md:block"
        animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <HexCell size={76} stroke="#B45309" opacity={0.3} />
      </motion.div>
      <motion.div
        className="absolute -right-2 -top-8 z-20"
        animate={{ y: [0, -16, 0], x: [0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <BeeMark size={54} />
      </motion.div>
      <motion.div
        className="absolute -bottom-6 -left-4 z-20 hidden sm:block"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3.5 py-2.5 shadow-[var(--shadow-lift)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-100 text-leaf-600">
            <Check size={13} strokeWidth={3} />
          </span>
          <div>
            <p className="text-[11.5px] font-semibold text-ink-900">Published to Instagram</p>
            <p className="font-mono text-[9px] text-ink-600/55">just now · 2,412 likes so far</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="absolute -right-3 top-1/3 z-20 hidden sm:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      >
        <div className="flex items-center gap-2 rounded-2xl border border-honey-400/60 bg-honey-50 px-3 py-2 shadow-[var(--shadow-card)]">
          <Sparkles size={13} className="text-honey-600" />
          <p className="text-[11px] font-semibold text-honey-800">Best time: Sun 6–9 pm</p>
        </div>
      </motion.div>

      {/* app window */}
      <motion.div
        initial={{ opacity: 0, y: 26, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-ink-800 bg-ink-900 shadow-[0_40px_80px_-30px_rgba(17,11,6,0.55)]"
        style={{ transformPerspective: 900 }}
      >
        {/* chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-honey-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime-500" />
          <span className="ml-3 flex-1 rounded-lg bg-white/[0.06] px-3 py-1 font-mono text-[10px] text-cream-50/50">
            beevo.app/calendar
          </span>
        </div>

        <div className="flex">
          {/* mini sidebar */}
          <div className="hidden w-14 flex-col items-center gap-3 border-r border-white/[0.06] py-4 sm:flex">
            <BeeMark size={26} />
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={
                  i === 1
                    ? "h-8 w-8 rounded-xl bg-honey-500/25 ring-1 ring-honey-500/50"
                    : "h-8 w-8 rounded-xl bg-white/[0.05]"
                }
              />
            ))}
          </div>

          {/* content */}
          <div className="flex-1 space-y-3 p-4">
            {/* stat chips */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Scheduled", v: "24" },
                { l: "Published", v: "86" },
                { l: "Engagement", v: "12.8k" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                  <p className="tnum text-[16px] font-bold text-honey-300">{s.v}</p>
                  <p className="font-mono text-[8.5px] uppercase tracking-widest text-cream-50/45">{s.l}</p>
                </div>
              ))}
            </div>

            {/* week strip */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="grid grid-cols-7 gap-1.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="text-center">
                    <p className="font-mono text-[8.5px] text-cream-50/40">{d}</p>
                    <div
                      className={
                        i === 3 || i === 6
                          ? "mt-1 flex h-10 items-center justify-center rounded-lg bg-honey-500/25 ring-1 ring-honey-500/50"
                          : "mt-1 flex h-10 items-center justify-center rounded-lg bg-white/[0.04]"
                      }
                    >
                      {i % 2 === 1 && <span className="h-1.5 w-1.5 rounded-full bg-honey-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* scheduled post card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-xl border border-honey-500/40 bg-gradient-to-r from-honey-500/15 to-transparent p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex -space-x-1">
                  {(["instagram", "facebook", "twitter"] as const).map((p) => (
                    <PlatformChip key={p} platform={p} size={20} className="ring-2 ring-ink-900" />
                  ))}
                </span>
                <Badge tone="gold" className="ml-auto">Scheduled</Badge>
              </div>
              <p className="mt-2 text-[12px] font-medium leading-snug text-cream-50/90">
                Golden hour, golden jar — Batch 42 drops Friday. 200 jars only.
              </p>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-honey-400/90">
                Friday · 6:00 pm IST · 3 channels
              </p>
            </motion.div>

            {/* progress bar */}
            <div className="flex items-center gap-2.5 px-1 pt-1">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-honey-400 to-honey-600"
                  initial={{ width: "12%" }}
                  animate={{ width: "78%" }}
                  transition={{ duration: 1.6, delay: 0.9, ease: "easeOut" }}
                />
              </div>
              <p className="font-mono text-[9px] text-cream-50/45">78% of week planned</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
