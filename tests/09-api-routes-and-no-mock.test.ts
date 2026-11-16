import { describe, expect, it } from "vitest";
import { GET as getAdminOverview } from "@/app/api/admin/overview/route";
import { GET as getCredits } from "@/app/api/credits/route";
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getMe } from "@/app/api/me/route";
import { GET as getPackages } from "@/app/api/packages/route";
import { GET as getVoices } from "@/app/api/voices/route";
import { POST as postRazorpayWebhook } from "@/app/api/webhooks/razorpay/route";

describe("Domain 9: Live API Route Handlers & Strict Zero-Mock Enforcement", () => {
  it("GET /api/health returns readiness flags with zero secret exposure", async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(typeof body.data.integrations).toBe("object");
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("sk-");
    expect(serialized).not.toContain("rzp_live");
  });

  it("GET /api/packages serves the exact 3 published credit packages", async () => {
    const res = await getPackages();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.packages).toHaveLength(3);
    expect(body.data.packages.map((p: { id: string }) => p.id)).toEqual([
      "starter",
      "creator",
      "studio",
    ]);
  });

  it("GET /api/voices fails honestly (503) when ELEVENLABS_API_KEY is absent — NEVER returns fake voices", async () => {
    const res = await getVoices();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(body.data).toBeUndefined();
  });

  it("Protected user & admin routes fail closed without returning mock profiles, balances, or metrics", async () => {
    const [meRes, creditsRes, adminRes] = await Promise.all([
      getMe(),
      getCredits(),
      getAdminOverview(new Request("http://localhost:3000/api/admin/overview")),
    ]);

    expect([401, 503]).toContain(meRes.status);
    expect([401, 503]).toContain(creditsRes.status);
    expect([401, 403, 503]).toContain(adminRes.status);
  });

  it("POST /api/webhooks/razorpay rejects forged/unsigned requests cleanly", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "payment.captured" }),
    });
    const res = await postRazorpayWebhook(req);
    expect([401, 503]).toContain(res.status);
  });
});
