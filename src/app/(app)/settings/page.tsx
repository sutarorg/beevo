"use client";

import * as React from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Globe,
  KeyRound,
  TriangleAlert,
  Copy,
  Check,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ShieldCheck,
  Upload,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  HexAvatar,
  Input,
  Label,
  Modal,
  Select,
  Switch,
} from "@/components/ui/primitives";
import { useApp } from "@/providers/app-provider";

/** Canvas downscale to a square JPEG — keeps uploads tiny and consistent. */
function downscaleImage(file: File, size: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      // Center-crop to square.
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unsupported image file"));
    };
    img.src = url;
  });
}

const TIMEZONES = [
  "Asia/Kolkata (GMT+5:30)",
  "Asia/Dubai (GMT+4:00)",
  "Asia/Singapore (GMT+8:00)",
  "Europe/London (GMT+0:00)",
  "America/New_York (GMT-5:00)",
];

interface ApiKey {
  id: string;
  name: string;
  masked: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { user, plan, refreshAll } = useApp();

  /* profile */
  const [name, setName] = React.useState("");
  const [workspace, setWorkspace] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [tz, setTz] = React.useState(TIMEZONES[0]);
  const [digest, setDigest] = React.useState(true);
  const [failAlerts, setFailAlerts] = React.useState(true);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  /* avatar */
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setWorkspace(user.workspace);
      setEmail(user.email);
      setTz(user.timezone);
      setDigest(user.digest);
      setAvatarUrl(user.avatarUrl ?? null);
    }
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch("/api/account/profile", {
        name,
        workspaceName: workspace,
        email,
        timezone: tz,
        digest,
      });
      setSaved(true);
      toast.success("Profile saved");
      await refreshAll();
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarBusy(true);
    try {
      // Downscale to 256×256 JPEG before upload — tiny payloads, fast loads,
      // and it fits the no-storage fallback path on unconfigured deployments.
      const resized = await downscaleImage(file, 256, 0.85);
      const form = new FormData();
      form.append("file", resized, "avatar.jpg");
      const { data } = await api.post<{ avatarUrl: string }>("/api/account/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarUrl(data.avatarUrl);
      toast.success("Avatar updated");
      await refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    try {
      await api.delete("/api/account/avatar");
      setAvatarUrl(null);
      toast.success("Avatar removed");
      await refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAvatarBusy(false);
    }
  }

  /* password */
  const [pwOpen, setPwOpen] = React.useState(false);

  /* api keys */
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = React.useState(true);
  const [newKeyOpen, setNewKeyOpen] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [issuedToken, setIssuedToken] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const loadKeys = React.useCallback(async () => {
    try {
      const { data } = await api.get<{ keys: ApiKey[] }>("/api/account/api-keys");
      setKeys(data.keys);
    } catch {
      /* surfaced on action */
    } finally {
      setKeysLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  async function createKey() {
    if (newKeyName.trim().length < 2) return toast.error("Give the key a name");
    setCreating(true);
    try {
      const { data } = await api.post<{ token: string }>("/api/account/api-keys", { name: newKeyName.trim() });
      setIssuedToken(data.token);
      setNewKeyName("");
      await loadKeys();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string, keyName: string) {
    try {
      await api.delete("/api/account/api-keys", { data: { id } });
      toast.success(`“${keyName}” revoked`);
      await loadKeys();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function copyText(text: string, label = "Copied to clipboard") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Clipboard blocked by your browser — select and copy manually");
    }
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://beevo.in");
  const activeKeys = keys.filter((k) => !k.revokedAt);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* ---------------- profile ---------------- */}
      <Card>
        <CardHeader title="Profile" subtitle="How you appear across the hive" />
        <form onSubmit={saveProfile} className="space-y-4 px-5 pb-5">
          <div className="flex flex-wrap items-center gap-4">
            {avatarUrl ? (
              <span className="hex-clip relative h-14 w-14 overflow-hidden bg-cream-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" />
              </span>
            ) : (
              <HexAvatar name={name || "Bee Keeper"} hue={36} size={56} />
            )}
            <div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  busy={avatarBusy}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={12} /> {avatarUrl ? "Change avatar" : "Upload avatar"}
                </Button>
                {avatarUrl && (
                  <Button type="button" size="xs" variant="ghost" className="!text-berry-600 hover:!bg-red-50" onClick={removeAvatar}>
                    Remove
                  </Button>
                )}
              </div>
              <p className="mt-1 font-mono text-[10px] text-ink-600/55">JPG · PNG · WebP — max 4 MB</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadAvatar} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Workspace</Label>
              <Input value={workspace} onChange={(e) => setWorkspace(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" busy={savingProfile} variant={saved ? "dark" : "primary"}>
              {saved ? <Check size={14} /> : null} {saved ? "Saved" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      {/* ---------------- security ---------------- */}
      <Card>
        <CardHeader title="Security" subtitle="Password & session protection" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-cream-100 text-ink-700">
              <Lock size={15} />
            </span>
            <div>
              <p className="text-[13.5px] font-medium text-ink-900">
                {user?.hasPassword ? "Password" : "Add a password"}
              </p>
              <p className="text-xs text-ink-600/65">
                {user?.hasPassword
                  ? "Changing it signs out every other device automatically."
                  : user?.authProvider === "google"
                    ? "Signed in with Google — optional email + password login."
                    : "No password set on this account yet."}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setPwOpen(true)}>
            {user?.hasPassword ? "Change password" : "Create password"}
          </Button>
        </div>
      </Card>

      {/* ---------------- preferences ---------------- */}
      <Card>
        <CardHeader title="Scheduling preferences" subtitle="Defaults applied to new posts" />
        <div className="space-y-1 px-5 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream-200/70 py-3.5">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-ink-600/60" />
              <div>
                <p className="text-[13.5px] font-medium text-ink-900">Timezone</p>
                <p className="text-xs text-ink-600/65">Used for calendar, queue and best-time engine</p>
              </div>
            </div>
            <Select
              value={tz}
              onChange={async (e) => {
                setTz(e.target.value);
                try {
                  await api.patch("/api/account/profile", { timezone: e.target.value });
                  toast.success("Timezone saved");
                  await refreshAll();
                } catch (err) {
                  toast.error(getErrorMessage(err));
                }
              }}
              className="!h-9 w-full text-[13px] sm:w-56"
            >
              {TIMEZONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-cream-200/70 py-3.5">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-ink-600/60" />
              <div>
                <p className="text-[13.5px] font-medium text-ink-900">Weekly digest email</p>
                <p className="text-xs text-ink-600/65">Every Monday — performance, queue and what needs love</p>
              </div>
            </div>
            <Switch
              checked={digest}
              onChange={async (v) => {
                setDigest(v);
                try {
                  await api.patch("/api/account/profile", { digest: v });
                  toast.success(v ? "Weekly digest on" : "Weekly digest off");
                  await refreshAll();
                } catch (err) {
                  setDigest(!v);
                  toast.error(getErrorMessage(err));
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3.5">
            <div className="flex items-center gap-3">
              <TriangleAlert size={16} className="text-ink-600/60" />
              <div>
                <p className="text-[13.5px] font-medium text-ink-900">Instant failure alerts</p>
                <p className="text-xs text-ink-600/65">Notify immediately when a post fails to publish</p>
              </div>
            </div>
            <Switch checked={failAlerts} onChange={setFailAlerts} />
          </div>
        </div>
      </Card>

      {/* ---------------- API & developers ---------------- */}
      <Card>
        <CardHeader
          title="API & developers"
          subtitle="Personal access tokens for the Beevo REST API"
          action={
            <Button size="xs" onClick={() => { setIssuedToken(null); setNewKeyOpen(true); }}>
              <Plus size={12} /> New key
            </Button>
          }
        />
        <div className="space-y-4 px-5 pb-5">
          <div>
            <Label>Base URL</Label>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-xl border border-cream-300 bg-ink-900 px-3.5 py-2.5 font-mono text-[12px] text-honey-300">
                {apiUrl}
              </code>
              <Button size="sm" variant="outline" onClick={() => copyText(apiUrl, "Base URL copied")}>
                <Copy size={13} /> Copy
              </Button>
            </div>
          </div>

          <div>
            <Label>Active tokens ({activeKeys.length})</Label>
            {keysLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-cream-300 bg-cream-50/60 px-3.5 py-3 text-[13px] text-ink-600/70">
                <Loader2 size={14} className="animate-spin" /> Loading keys…
              </div>
            ) : keys.length === 0 ? (
              <div className="rounded-xl border border-dashed border-cream-300 bg-cream-50/50 px-4 py-6 text-center">
                <KeyRound size={18} className="mx-auto text-ink-600/40" />
                <p className="mt-2 text-[13px] font-medium text-ink-800">No API keys yet</p>
                <p className="mt-0.5 text-xs text-ink-600/70">
                  Create one to script posting, pull analytics or build integrations.
                </p>
                <Button size="xs" className="mt-3" onClick={() => { setIssuedToken(null); setNewKeyOpen(true); }}>
                  <Plus size={12} /> Create your first key
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {keys.map((k) => (
                  <li
                    key={k.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3",
                      k.revokedAt ? "border-cream-200 bg-cream-50/40 opacity-60" : "border-cream-300 bg-white"
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cream-300 bg-cream-100 text-ink-700">
                      <KeyRound size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-900">
                        {k.name}
                        {k.revokedAt ? (
                          <Badge tone="red">Revoked</Badge>
                        ) : (
                          <Badge tone="green">Active</Badge>
                        )}
                      </p>
                      <p className="truncate font-mono text-[11px] text-ink-600/60">{k.masked}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-ink-600/45">
                        created {formatDistanceToNow(new Date(k.createdAt), { addSuffix: true })}
                        {k.lastUsedAt ? ` · last used ${formatDistanceToNow(new Date(k.lastUsedAt), { addSuffix: true })}` : " · never used"}
                      </p>
                    </div>
                    {!k.revokedAt && (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="!text-berry-600 hover:!bg-red-50"
                        onClick={() => revokeKey(k.id, k.name)}
                      >
                        <Trash2 size={12} /> Revoke
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-600/60">
              <ShieldCheck size={11} className="text-leaf-600" />
              Tokens are hashed with SHA-256 — the full value is shown only once at creation.
            </p>
          </div>
        </div>
      </Card>

      {/* ---------------- danger ---------------- */}
      <Card className="!border-berry-600/30">
        <CardHeader title={<span className="text-berry-600">Danger zone</span>} subtitle="Irreversible actions" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
          <div>
            <p className="text-[13.5px] font-medium text-ink-900">Delete workspace</p>
            <p className="text-xs text-ink-600/65">Removes every post, account connection and statistic.</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            disabled={plan === "pro"}
            onClick={() => toast.error("Contact support@beevo.in to delete a workspace")}
          >
            Delete workspace
          </Button>
        </div>
      </Card>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />

      {/* new API key modal */}
      <Modal open={newKeyOpen} onClose={() => { setNewKeyOpen(false); setIssuedToken(null); }} size="sm">
        <div className="p-6">
          {issuedToken ? (
            <>
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-950">
                <ShieldCheck size={18} className="text-leaf-600" /> Copy your API key now
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600/85">
                This is the only time the full token is shown. Store it in your password manager or
                environment variables.
              </p>
              <code className="mt-4 block w-full break-all rounded-xl border border-honey-500/40 bg-ink-900 px-3.5 py-3 font-mono text-[12px] text-honey-300">
                {issuedToken}
              </code>
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => copyText(issuedToken, "API key copied")}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy key"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setNewKeyOpen(false); setIssuedToken(null); }}>
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold tracking-tight text-ink-950">Create API key</h3>
              <p className="mt-1.5 text-[13px] text-ink-600/85">
                Scoped to this workspace with posts read/write and analytics read access.
              </p>
              <div className="mt-4">
                <Label>Key name</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Zapier integration"
                  onKeyDown={(e) => e.key === "Enter" && createKey()}
                />
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setNewKeyOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" busy={creating} onClick={createKey}>
                  Create key
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------- change password modal ------------------------- */
function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useApp();
  const hasPassword = !!user?.hasPassword;
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setShow(false);
    }
  }, [open]);

  const strength = React.useMemo(() => {
    let s = 0;
    if (next.length >= 8) s++;
    if (next.length >= 12) s++;
    if (/[0-9]/.test(next) && /[a-zA-Z]/.test(next)) s++;
    if (/[^a-zA-Z0-9]/.test(next)) s++;
    return s; // 0..4
  }, [next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return toast.error("New passwords do not match");
    setBusy(true);
    try {
      const { data } = await api.post<{ message: string }>("/api/account/password", {
        // Only send the current password when the account actually has one
        ...(hasPassword ? { currentPassword: current } : {}),
        newPassword: next,
        confirmPassword: confirm,
      });
      toast.success(data.message);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    autoComplete: string,
    placeholder: string
  ) => (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setter(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="!pr-11"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide passwords" : "Show passwords"}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-ink-600/50 transition-colors hover:text-ink-900"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <form onSubmit={submit} className="p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-950">
          <Lock size={17} className="text-honey-600" /> {hasPassword ? "Change password" : "Create a password"}
        </h3>
        <p className="mt-1.5 text-[13px] text-ink-600/85">
          {hasPassword
            ? "For your security, all other signed-in devices will be logged out."
            : user?.authProvider === "google"
              ? "Your account was created with Google — set a password to also log in with email + password."
              : "Set a sign-in password for this account."}
        </p>

        <div className="mt-4 space-y-3.5">
          {hasPassword && field("Current password", current, setCurrent, "current-password", "••••••••")}
          {field("New password", next, setNext, "new-password", "8+ chars, letters & numbers")}
          {next && (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < strength ? (strength <= 1 ? "bg-berry-600" : strength <= 2 ? "bg-honey-500" : "bg-leaf-500") : "bg-cream-300"
                  )}
                />
              ))}
              <span className="ml-1 font-mono text-[10px] text-ink-600/60">
                {["weak", "weak", "fair", "good", "strong"][strength]}
              </span>
            </div>
          )}
          {field("Confirm new password", confirm, setConfirm, "new-password", "Repeat new password")}
          {confirm && next !== confirm && (
            <p className="text-[11px] font-medium text-berry-600">Passwords do not match</p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" busy={busy} disabled={(hasPassword && !current) || !next || next !== confirm}>
            Update password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
