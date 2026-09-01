"use client";

import * as React from "react";
import { toast } from "sonner";
import { User, Bell, Globe, KeyRound, TriangleAlert, Copy, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, HexAvatar, Input, Label, Select, Switch } from "@/components/ui/primitives";
import { useApp } from "@/providers/app-provider";

const TIMEZONES = [
  "Asia/Kolkata (GMT+5:30)",
  "Asia/Dubai (GMT+4:00)",
  "Asia/Singapore (GMT+8:00)",
  "Europe/London (GMT+0:00)",
  "America/New_York (GMT-5:00)",
];

export default function SettingsPage() {
  const { user, plan } = useApp();
  const [name, setName] = React.useState("");
  const [workspace, setWorkspace] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [tz, setTz] = React.useState(TIMEZONES[0]);
  const [digest, setDigest] = React.useState(true);
  const [autoQueue, setAutoQueue] = React.useState(true);
  const [failAlerts, setFailAlerts] = React.useState(true);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setWorkspace(user.workspace);
      setEmail(user.email);
      setTz(user.timezone);
      setDigest(user.digest);
    }
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    toast.success("Profile saved (demo persistence)");
    setTimeout(() => setSaved(false), 1600);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/ (same-origin Next API routes)";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* profile */}
      <Card>
        <CardHeader title="Profile" subtitle="How you appear across the hive" />
        <form onSubmit={saveProfile} className="space-y-4 px-5 pb-5">
          <div className="flex items-center gap-4">
            <HexAvatar name={name || "Bee Keeper"} hue={36} size={56} />
            <div>
              <Button type="button" size="xs" variant="outline" onClick={() => toast.success("Avatar uploads are mocked in this demo")}>
                Change avatar
              </Button>
              <p className="mt-1 font-mono text-[10px] text-ink-600/55">PNG · 400×400 · hex-cropped</p>
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
            <Button type="submit" size="sm" variant={saved ? "dark" : "primary"}>
              {saved ? <Check size={14} /> : null} {saved ? "Saved" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      {/* preferences */}
      <Card>
        <CardHeader title="Scheduling preferences" subtitle="Defaults applied to new posts" />
        <div className="space-y-1 px-5 pb-5">
          <div className="flex items-center justify-between gap-4 border-b border-cream-200/70 py-3.5">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-ink-600/60" />
              <div>
                <p className="text-[13.5px] font-medium text-ink-900">Timezone</p>
                <p className="text-xs text-ink-600/65">Used for calendar, queue and best-time engine</p>
              </div>
            </div>
            <Select value={tz} onChange={(e) => setTz(e.target.value)} className="!h-9 w-56 text-[13px]">
              {TIMEZONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
          <PrefRow
            icon={Bell}
            title="Weekly digest email"
            body="Every Monday — what performed, what's queued, what needs love"
            checked={digest}
            onChange={(v) => { setDigest(v); toast.success(v ? "Weekly digest on" : "Weekly digest off"); }}
          />
          <PrefRow
            icon={Check}
            title="Auto-fill empty queue slots"
            body="Suggest drafts when a day in your cadence has no posts"
            checked={autoQueue}
            onChange={setAutoQueue}
            locked={plan !== "pro"}
          />
          <PrefRow
            icon={TriangleAlert}
            title="Instant failure alerts"
            body="Notify immediately when a post fails to publish"
            checked={failAlerts}
            onChange={setFailAlerts}
          />
        </div>
      </Card>

      {/* api */}
      <Card>
        <CardHeader title="API & developers" subtitle="Where this frontend talks to" />
        <div className="space-y-3 px-5 pb-5">
          <div>
            <Label>Base URL · NEXT_PUBLIC_API_URL</Label>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-xl border border-cream-300 bg-ink-900 px-3.5 py-2.5 font-mono text-[12px] text-honey-300">
                {apiUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(apiUrl).catch(() => undefined);
                  toast.success("Copied to clipboard");
                }}
              >
                <Copy size={13} /> Copy
              </Button>
            </div>
          </div>
          <div>
            <Label>Personal access token</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 font-mono text-[12px] text-ink-700">
                beevo_pat_•••••••••••••••••9f3d
              </code>
              <Button size="sm" variant="outline" onClick={() => toast.success("New token issued (demo)")}>
                <RefreshCw size={13} /> Rotate
              </Button>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-600/60">
              <KeyRound size={11} /> Full access to posts, accounts and analytics scopes.
            </p>
          </div>
        </div>
      </Card>

      {/* danger */}
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
            onClick={() => toast.error("Demo workspaces can't be deleted — nice try, bee.")}
          >
            Delete workspace
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PrefRow({
  icon: Icon,
  title,
  body,
  checked,
  onChange,
  locked,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-cream-200/70 py-3.5 last:border-b-0", locked && "opacity-70")}>
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-ink-600/60" />
        <div>
          <p className="flex items-center gap-2 text-[13.5px] font-medium text-ink-900">
            {title}
            {locked && <span className="rounded-full bg-gradient-to-r from-honey-400 to-honey-600 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-ink-950">Pro</span>}
          </p>
          <p className="text-xs text-ink-600/65">{body}</p>
        </div>
      </div>
      <Switch checked={locked ? false : checked} onChange={locked ? () => toast.error("That's a Pro preference") : onChange} />
    </div>
  );
}
