import fs from "node:fs";
import path from "node:path";
import chromium from "@sparticuz/chromium";
import { chromium as pwChromium } from "playwright";

const BASE = "http://127.0.0.1:3000";
const ROUTES = [
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/app",
  "/app/create",
  "/app/credits",
  "/admin",
  "/admin/ai-costs",
  "/admin/configuration",
];

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 740 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

async function run() {
  const execPath = await chromium.executablePath();
  const launchArgs = chromium.args.filter((a) => a !== "--single-process");
  const env = { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib:/tmp" };
  const shotDir = "/tmp/beevo-phase4-qa";
  fs.mkdirSync(shotDir, { recursive: true });

  const results = [];
  let failures = 0;

  for (const route of ROUTES) {
    const browser = await pwChromium.launch({
      executablePath: execPath,
      headless: true,
      args: launchArgs,
      env,
    });
    try {
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await ctx.newPage();
        const pageErrors = [];
        const consoleErrors = [];
        const failedRequests = [];
        page.on("pageerror", (e) => pageErrors.push(e.message));
        page.on("console", (msg) => {
          if (msg.type() === "error") consoleErrors.push(msg.text());
        });
        page.on("response", (res) => {
          if (res.status() >= 400 && !res.url().includes("/api/")) {
            failedRequests.push(`${res.status()} ${res.url()}`);
          }
        });

        const resp = await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 30000 });
        // Force-load lazy images and wait for decode so we truly verify zero broken images
        await page.evaluate(async () => {
          const imgs = Array.from(document.querySelectorAll("img"));
          for (const img of imgs) {
            img.loading = "eager";
            if (!img.complete) {
              await new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
                setTimeout(resolve, 2500);
              });
            }
          }
        });

        const metrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const imgs = Array.from(document.querySelectorAll("img"));
          const brokenImgs = imgs.filter(
            (img) => img.offsetParent !== null && img.complete && img.naturalWidth === 0
          ).length;
          return {
            overflowPx: Math.max(0, doc.scrollWidth - doc.clientWidth),
            brokenImgs,
            title: document.title,
          };
        });

        const ok =
          resp &&
          resp.status() === 200 &&
          metrics.overflowPx <= 2 &&
          metrics.brokenImgs === 0 &&
          failedRequests.length === 0 &&
          pageErrors.length === 0 &&
          consoleErrors.length === 0;

        if (!ok) failures += 1;
        results.push({
          route,
          viewport: vp.name,
          status: resp?.status(),
          overflowPx: metrics.overflowPx,
          brokenImgs: metrics.brokenImgs,
          pageErrors,
          consoleErrors,
          ok,
        });

        if (vp.name === "desktop-1440" || vp.name === "mobile-390") {
          const slug = route === "/" ? "home" : route.slice(1).replace(/\//g, "_");
          await page.screenshot({
            path: path.join(shotDir, `${slug}-${vp.name}.png`),
            fullPage: false,
          });
        }
        await ctx.close();
      }
    } finally {
      await browser.close();
    }
  }

  // Interactive check: submit /login form and verify genuine 503 backend response surfaced cleanly
  const browser = await pwChromium.launch({
    executablePath: execPath,
    headless: true,
    args: launchArgs,
    env,
  });
  let loginInteractiveOk = false;
  let loginStatusText = "";
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/login`, { waitUntil: "load" });
    await page.fill("#login-email", "creator@example.com");
    await page.fill("#login-password", "StrongPass123");
    await page.click('button[type="submit"]');
    await page.waitForSelector('[role="status"]', { timeout: 8000 });
    loginStatusText = (await page.textContent('[role="status"]'))?.trim() ?? "";
    loginInteractiveOk = loginStatusText.includes("Authentication service not configured");
  } finally {
    await browser.close();
  }

  console.log(
    JSON.stringify(
      {
        totalChecks: results.length,
        passedChecks: results.filter((r) => r.ok).length,
        failures,
        loginInteractiveOk,
        loginStatusText,
        failedEntries: results.filter((r) => !r.ok),
      },
      null,
      2
    )
  );

  if (failures > 0 || !loginInteractiveOk) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
