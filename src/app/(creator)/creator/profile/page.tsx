"use client";

import { Camera, Globe, Link2, Loader2, LogOut, Plus, Trash2, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { shareableOrigin } from "@/lib/config";
import { useAsyncData } from "@/lib/hooks";
import { getAuthService } from "@/lib/services/auth";
import { getCreatorDataService } from "@/lib/services/creator-data";
import { getMediaService, UPLOAD_RULES, validateUploadFile } from "@/lib/services/media";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/creator/dialogs";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      setDisplayName(state.data.displayName);
      setHandle(state.data.handle);
      setTagline(state.data.tagline);
      setNiche(state.data.niche);
      setLinks(state.data.links);
      setAvatarUrl(state.data.avatarUrl);
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
  const origin = shareableOrigin();
  const publicHost = origin.replace(/^https?:\/\//, "");
  const publicUrl = `${origin}/@${handle || profile.handle}`;

  const changeAvatar = async (file: File | undefined) => {
    if (!file || !service) return;
    const media = getMediaService();
    if (!media) {
      toast.push({ variant: "error", title: "Photo upload isn't available in this environment." });
      return;
    }
    const validationError = validateUploadFile("avatar", file);
    if (validationError) {
      toast.push({ variant: "error", title: "That photo can't be used", description: validationError });
      return;
    }
    setAvatarBusy(true);
    setAvatarProgress(0);
    const session = await media.beginUpload({
      courseId: "",
      kind: "avatar",
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });
    if (!session.ok) {
      setAvatarBusy(false);
      toast.push({ variant: "error", title: "Couldn't start the upload", description: session.error.message });
      return;
    }
    const uploaded = await media.performUpload({ ...session.data, file }, {
      onProgress: setAvatarProgress,
    });
    if (!uploaded.ok) {
      setAvatarBusy(false);
      toast.push({ variant: "error", title: "Photo not uploaded", description: uploaded.error.message });
      return;
    }
    const saved = await service.updateProfile({ avatarAssetId: uploaded.data.id });
    setAvatarBusy(false);
    if (!saved.ok) {
      await media.deleteUpload(uploaded.data.id);
      toast.push({ variant: "error", title: "Photo not saved", description: saved.error.message });
      return;
    }
    setAvatarUrl(saved.data.avatarUrl);
    toast.push({ variant: "success", title: "Profile photo updated", description: "Your storefront now shows this photo." });
  };

  const removeAvatar = async () => {
    if (!service) return;
    setAvatarBusy(true);
    const saved = await service.updateProfile({ avatarAssetId: null });
    setAvatarBusy(false);
    if (!saved.ok) {
      toast.push({ variant: "error", title: "Photo not removed", description: saved.error.message });
      return;
    }
    setAvatarUrl(saved.data.avatarUrl);
    toast.push({
      variant: "success",
      title: "Profile photo removed",
      description: "Your storefront shows the default user icon again.",
    });
  };

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

  const signOut = async () => {
    // Destroy the server session + cookie first, then leave for sign-in.
    await getAuthService()?.signOut();
    window.location.assign("/login");
  };

  return (
    <div>
      <PageHeader title="Profile" sub="What buyers see on your public storefront — your name, face, and links." />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs sm:p-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarBusy}
                aria-label="Change profile photo"
                title="Change profile photo"
                className="group relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-ink disabled:cursor-wait"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Your profile photo" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-parchment text-smoke">
                    <UserRound className="size-7" strokeWidth={2} aria-hidden="true" />
                  </span>
                )}
                <span className="absolute inset-0 grid place-items-center bg-ink/55 text-cream opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {avatarBusy ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Camera className="size-5" aria-hidden="true" />
                  )}
                </span>
                {avatarBusy ? (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[9px] font-bold text-cream">
                    {avatarProgress}%
                  </span>
                ) : null}
              </button>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">Profile photo</p>
                <p className="mt-0.5 text-xs text-smoke">
                  {avatarUrl ? "Click your photo to replace it." : "No photo yet — the default user icon is shown."}{" "}
                  {UPLOAD_RULES.avatar.label}.
                </p>
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => void removeAvatar()}
                    disabled={avatarBusy}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-accent underline underline-offset-2 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remove photo
                  </button>
                ) : null}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept={UPLOAD_RULES.avatar.accept}
                className="hidden"
                onChange={(event) => {
                  void changeAvatar(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>

            <div className="mt-5 space-y-4">
              <Field id="profile-name" label="Display name">
                <Input id="profile-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
              </Field>
              <Field
                id="profile-handle"
                label="Handle"
                hint="Lowercase letters, numbers, hyphens."
                error={handleError ?? undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border-2 border-ink bg-parchment px-3 py-3 text-sm font-bold text-smoke">
                    {publicHost}/@
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
            <Button variant="outline" className="ml-auto" onClick={() => setConfirmSignOut(true)}>
              <LogOut className="size-4" aria-hidden="true" />
              Log out
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
            {(handle || profile.handle) ? (
              <>
                <p className="mt-2 truncate text-sm font-bold">{publicUrl}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyButton text={publicUrl} variant="lime" />
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-cream/40 px-3 py-1.5 text-xs font-bold text-cream transition-colors hover:border-lime hover:text-lime"
                  >
                    <Globe className="size-3.5" aria-hidden="true" />
                    Open storefront
                  </a>
                </div>
                <p className="mt-3 text-[11px] text-cream/50">
                  Share this link anywhere your audience already follows you — it opens your public
                  storefront with every published course.
                </p>
              </>
            ) : (
              <p className="mt-2 rounded-xl border-2 border-lime/40 bg-lime/10 p-3 text-xs leading-relaxed text-cream/80">
                Choose a handle and save — your storefront link goes live the moment it&apos;s
                saved.
              </p>
            )}
          </div>

          <div aria-hidden="true" className="pointer-events-none rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-xs">
            <p className="mb-4 text-xs font-bold tracking-[0.18em] text-smoke uppercase">
              Live preview
            </p>
            <div className="flex items-center gap-3">
              <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-parchment">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <UserRound className="size-6 text-smoke" strokeWidth={2} aria-hidden="true" />
                )}
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
              Your published courses appear below on your storefront.
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Log out?"
        body="Your profile, courses, and earnings stay saved on your account for the next sign-in."
        confirmLabel="Log out"
        onConfirm={() => void signOut()}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
