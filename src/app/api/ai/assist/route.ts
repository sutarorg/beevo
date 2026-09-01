import { z } from "zod";
import { handler, ok, parseBody, ApiError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { env } from "@/lib/server/env";
import { AI_SUGGESTIONS } from "@/lib/mock";
import { rateLimit } from "@/lib/server/rate-limit";
import { clientIp } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const HOOKS: Record<string, string[]> = {
  playful: ["POV:", "Plot twist:", "Okay but hear us out —", "Stop scrolling. Really."],
  professional: ["We're excited to share:", "Announcement:", "New this week:", "A quick update from the hive:"],
  bold: ["No syrups. No shortcuts.", "200 jars. Zero restocks.", "This is your sign.", "Friday. 9 am. Be there."],
};

const schema = z.object({
  brief: z.string().trim().max(2000).default(""),
  tone: z.enum(["playful", "professional", "bold"]).default("playful"),
});

export const POST = handler(async (req: Request) => {
  const { workspace } = await requireUser();
  const ip = clientIp(req);
  const rl = rateLimit(`ai:${ip}:${workspace.id}`, 30, 10 * 60 * 1000);
  if (!rl.ok) throw new ApiError(429, `Writing too fast — retry in ${rl.retryAfterSec}s`);

  const { brief, tone } = await parseBody(req, schema);

  // Pro gate — the assistant is a paid feature.
  if (workspace.plan !== "pro") {
    throw new ApiError(403, "Hive Writer is a Pro feature", "PLAN_LIMIT");
  }

  /* Live mode: OpenAI when OPENAI_API_KEY is configured. */
  if (env.openAiKey()) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.openAiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.9,
          messages: [
            {
              role: "system",
              content:
                "You are Beevo Hive Writer, a social media caption expert for Indian D2C brands. Write punchy, platform-ready captions with a hook. No hashtags unless asked. Return exactly 3 distinct captions, one per line, no numbering.",
            },
            { role: "user", content: `Tone: ${tone}. Brief: ${brief || "small-batch honey launch on Friday"}. Write 3 captions, each under 60 words.` },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const lines = (data.choices?.[0]?.message?.content ?? "")
          .split("\n")
          .map((l: string) => l.replace(/^[-*\d.)\s]+/, "").trim())
          .filter(Boolean)
          .slice(0, 3);
        if (lines.length) return ok({ suggestions: lines, model: "gpt-4o-mini" });
      }
    } catch (err) {
      console.warn("[ai] OpenAI failed, falling back to templates:", err);
    }
  }

  /* Template fallback (always available). */
  const hooks = HOOKS[tone] ?? HOOKS.playful;
  const pool = [...AI_SUGGESTIONS].sort(() => Math.random() - 0.5);
  const suggestions = pool.slice(0, 3).map((s, i) => {
    if (!brief) return s;
    const hook = hooks[i % hooks.length];
    const subject = brief.length > 60 ? brief.slice(0, 60).trimEnd() + "…" : brief;
    return `${hook} ${subject.charAt(0).toLowerCase()}${subject.slice(1)} — ${
      ["details below.", "save the date.", "tell us below.", "link in bio."][i % 4]
    }`;
  });
  return ok({ suggestions, model: "beevo-templates-1" });
});
