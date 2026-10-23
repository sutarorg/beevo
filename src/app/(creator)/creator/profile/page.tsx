"use client";

import { Globe, Link2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAsyncData } from "@/lib/hooks";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { cn } from "@/lib/utils";
import {
  CardListSkeleton,
  CopyButton,
  FailedState,
  PageHeader,
} from "@/components/creator/ui";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

export default function CreatorProfilePage() {
  const toast = useToast();
  const service = getCreatorDataService();
  const { state, reload } = useAsyncData(
    () =>
      service
        ? service.getProfile()
        : Promise.resolve({ ok: false as const, error: { code: "unavailable", message: "Service unavailable" } }),
    [],
  );

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [tagline, setTagline] = useState("");
  const [niche, setNiche] = useState("");
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      setDisplayName(state.data.displayName);
      setHandle(state.data.handle);
      setTagline(state.data.tagline);
      setNiche(state.data.niche);
      setLinks(state.data.links);
    }
  }, [state]);

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div>
        <PageHeader title="Profile" sub="Your public creator identity." />
        <CardListSkeleton count={3} />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        <PageHeader title="Profile" sub="Your public creator identity." />
        <FailedState body={state.error.message} onRetry={reload} />
      </div>
    );
  }

  const profile = state.data;
  const publicUrl = `https://coursekit.app/@${handle || profile.handle}`;

  const save = async () => {
    if (!service) return;
    setSaving(true);
    setHandleError(null);
    const result = await service.updateProfile({ displayName, handle, tagline, niche, links });
    setSaving(false);
    if (!result.ok) {
      const fieldError = result.error.fieldErrors?.handle?.[0];
      if (fieldError) setHandleError(fieldError);
      toast.push({ variant: "error", title: "Profile not saved", description: result.error.message });
      return;
    }
    toast.push({ variant: "success", title: "Profile saved", description: "Your public page will use these details." });
    reload();
  };

  return (
    <div>
      <PageHeader title="Profile" sub="What buyers see on your public storefront — your name, face, and links." />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-ink">
                <Image src={profile.avatarUrl} alt="Your profile photo" fill sizes="64px" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Profile photo</p>
                <p className="mt-0.5 text-xs text-smoke">
                  Managed with your account media once storage connects in Prompt 5.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Field id="profile-name" label="Display name">
                <Input id="profile-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
              </Field>
              <Field
                id="profile-handle"
                label="Handle"
                hint="Lowercase letters, numbers, hyphens. Try “support” to see the taken-state (demo)."
                error={handleError ?? undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border-2 border-ink bg-parchment px-3 py-3 text-sm font-bold text-smoke">
                    coursekit.app/@
                  </span>
                  <Input
                    id="profile-handle"
                    value={handle}
                    invalid={Boolean(handleError)}
                    onChange={(e) => {
                      setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      setHandleError(null);
                    }}
                    maxLength={30}
                  />
                </div>
              </Field>
              <Field id="profile-tagline" label="Tagline" hint={`${tagline.length}/140`}>
                <textarea
                  id="profile-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={140}
                  rows={2}
                  className="w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
                />
              </Field>
              <Field id="profile-niche" label="Niche">
                <Input id="profile-niche" value={niche} onChange={(e) => setNiche(e.target.value)} maxLength={40} placeholder="e.g. Photography" />
              </Field>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-ink">Your links</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLinks([...links, { label: "", url: "" }])}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add link
              </Button>
            </div>
            <p className="mt-1 text-xs text-smoke">The same links you share everywhere — they surface on your storefront.</p>
            <ul className="mt-4 space-y-2.5">
              {links.map((link, index) => (
                <li key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <Input
                    value={link.label}
                    onChange={(e) => {
                      const next = [...links];
                      next[index] = { ...next[index], label: e.target.value };
                      setLinks(next);
                    }}
                    placeholder="Label (e.g. YouTube)"
                    aria-label={`Link ${index + 1} label`}
                    className="sm:max-w-36"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const next = [...links];
                      next[index] = { ...next[index], url: e.target.value };
                      setLinks(next);
                    }}
                    placeholder="https://…"
                    aria-label={`Link ${index + 1} URL`}
                    type="url"
                  />
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, i) => i !== index))}
                    aria-label={`Remove link ${index + 1}`}
                    className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink/20 text-smoke transition-colors hover:border-accent hover:text-accent"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {links.length === 0 ? (
                <li className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-5 text-center text-xs text-smoke">
                  No links yet — add the places your audience already follows you.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button variant="accent" onClick={save} loading={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
            <Button variant="outline" onClick={reload} disabled={saving}>
              Discard changes
            </Button>
          </div>
        </div>

        {/* Public URL + live preview */}
        <div className="space-y-5">
          <div className="rounded-3xl border-2 border-ink bg-ink p-5 text-cream shadow-hard-xs">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-lime uppercase">
              <Globe className="size-4" aria-hidden="true" />
              Public storefront URL
            </p>
            <p className="mt-2 truncate text-sm font-bold">{publicUrl}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyButton text={publicUrl} variant="lime" />
            </div>
            <p className="mt-3 text-[11px] text-cream/50">
              The storefront route itself ships with the backend phase — today this is the exact URL
              it will live at.
            </p>
          </div>

          <div aria-hidden="true" className="pointer-events-none rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs">
            <p className="mb-4 text-xs font-bold tracking-[0.18em] text-smoke uppercase">
              Preview (mock)
            </p>
            <div className="flex items-center gap-3">
              <div className="relative size-12 overflow-hidden rounded-full border-2 border-ink">
                <Image src={profile.avatarUrl} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{displayName || "Your name"}</p>
                <p className="text-xs font-semibold text-accent">@{handle || "handle"}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-smoke">{tagline || "Your tagline will appear here."}</p>
            {niche ? (
              <span className="mt-2 inline-block rounded-full border-2 border-ink bg-lime px-2.5 py-0.5 text-[10px] font-bold uppercase">
                {niche}
              </span>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {links
                .filter((link) => link.label.trim())
                .map((link, index) => (
                  <span key={index} className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-cream px-2.5 py-1 text-[10px] font-bold text-ink">
                    <Link2 className="size-3" aria-hidden="true" />
                    {link.label}
                  </span>
                ))}
            </div>
            <div className={cn("mt-4 rounded-xl border-2 border-dashed border-ink/30 px-3 py-2 text-center text-[10px] text-smoke")}>
              Your published courses appear below on the real storefront.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
