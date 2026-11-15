import fs from "node:fs";
import path from "node:path";
import chromium from "@sparticuz/chromium";
import { chromium as pwChromium } from "playwright";

const BASE_URL = "http://127.0.0.1:3000";
const OUT_DIR = path.resolve(process.cwd(), "qa-screenshots/phase3");
fs.mkdirSync(OUT_DIR, { recursive: true });

const ADMIN_ROUTES = [
  "/admin",
  "/admin/users",
  "/admin/users/inspect",
  "/admin/generations",
  "/admin/generations/inspect",
  "/admin/payments",
  "/admin/credits",
  "/admin/ai-costs",
  "/admin/media-library",
  "/admin/music-library",
  "/admin/configuration",
  "/admin/audit-logs",
];

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 680 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-600", width: 600, height: 900 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 900 },
  { name: "desktop-1280", width: 1280, height: 860 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

const SCREENSHOT_TARGETS = new Set([
  "/admin|desktop-1440",
  "/admin|tablet-768",
  "/admin|mobile-320",
  "/admin/users|desktop-1440",
  "/admin/users/inspect|desktop-1440",
  "/admin/generations|desktop-1440",
  "/admin/generations|mobile-375",
  "/admin/generations/inspect|desktop-1440",
  "/admin/ai-costs|desktop-1440",
  "/admin/payments|desktop-1440",
  "/admin/credits|desktop-1440",
  "/admin/credits|mobile-375",
  "/admin/media-library|desktop-1440",
  "/admin/music-library|desktop-1440",
  "/admin/configuration|desktop-1440",
  "/admin/audit-logs|desktop-1440",
]);

function slugifyRoute(route) {
  return route.replace(/^\//, "").replaceAll("/", "_") || "home";
}

async function launchBrowser() {
  const executablePath = await chromium.executablePath();
  const safeArgs = [
    ...chromium.args.filter((a) => a !== "--single-process"),
    "--disable-dev-shm-usage",
  ];
  return pwChromium.launch({
    executablePath,
    headless: true,
    args: safeArgs,
    env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib:/tmp" },
  });
}

async function runMatrix() {
  const results = [];
  const failures = [];

  for (const route of ADMIN_ROUTES) {
    const browser = await launchBrowser();
    try {
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        });
        const page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        const failedRequests = [];

        page.on("console", (msg) => {
          if (msg.type() === "error") consoleErrors.push(msg.text());
        });
        page.on("pageerror", (err) => pageErrors.push(err.message));
        page.on("response", (res) => {
          if (res.status() >= 400 && !res.url().includes("favicon")) {
            failedRequests.push(`${res.status()} ${res.url()}`);
          }
        });

        await page.goto(`${BASE_URL}${route}`, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(180);

        const metrics = await page.evaluate(() => {
          const docEl = document.documentElement;
          const overflowX = Math.max(0, Math.round(docEl.scrollWidth - docEl.clientWidth));
          const brokenImages = Array.from(document.querySelectorAll("img")).filter(
            (img) => !img.complete || img.naturalWidth === 0
          ).length;
          const h1Count = document.querySelectorAll("h1").length;
          return { overflowX, brokenImages, h1Count };
        });

        const key = `${route}|${vp.name}`;
        if (SCREENSHOT_TARGETS.has(key)) {
          const filePath = path.join(OUT_DIR, `${slugifyRoute(route)}__${vp.name}.png`);
          await page.screenshot({ path: filePath, fullPage: true });
        }

        const passed =
          metrics.overflowX === 0 &&
          metrics.brokenImages === 0 &&
          metrics.h1Count >= 1 &&
          consoleErrors.length === 0 &&
          pageErrors.length === 0 &&
          failedRequests.length === 0;

        const record = {
          route,
          viewport: vp.name,
          width: vp.width,
          overflowX: metrics.overflowX,
          brokenImages: metrics.brokenImages,
          h1Count: metrics.h1Count,
          consoleErrors,
          pageErrors,
          failedRequests,
          passed,
        };
        results.push(record);
        if (!passed) failures.push(record);

        await context.close();
      }
    } finally {
      await browser.close();
    }
  }

  return { results, failures };
}

async function runInteractiveChecks() {
  const checks = [];
  const browser = await launchBrowser();

  try {
    // 1. Mobile 320px drawer open & Escape close
    {
      const ctx = await browser.newContext({ viewport: { width: 320, height: 680 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "load" });
      await page.getByRole("button", { name: "Open admin navigation menu" }).click();
      const drawerVisible = await page.getByRole("dialog", { name: "Admin navigation drawer" }).isVisible();
      await page.keyboard.press("Escape");
      const drawerClosed = !(await page.getByRole("dialog", { name: "Admin navigation drawer" }).isVisible());
      checks.push({ name: "Mobile 320px drawer open + Escape close", passed: drawerVisible && drawerClosed });
      await ctx.close();
    }

    // 2. Overview Date Range Custom + Formulas toggle
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin`, { waitUntil: "load" });
      await page.getByRole("button", { name: "Custom period" }).click();
      const customVisible = await page.getByLabel("From").isVisible();
      await page.getByRole("button", { name: "Inspect Metric Formulas" }).click();
      const formulaVisible = await page.getByText("COUNT(profiles)").isVisible();
      checks.push({
        name: "Overview custom date range + 16 KPI formulas toggle",
        passed: customVisible && formulaVisible,
      });
      await ctx.close();
    }

    // 3. Users table sort aria-sort + User Detail Suspend dialog
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: "load" });
      await page.getByRole("button", { name: "Credit balance" }).click();
      const sortedHeader = await page.locator('th[aria-sort="descending"]').count();
      await page.goto(`${BASE_URL}/admin/users/inspect`, { waitUntil: "load" });
      await page.getByRole("button", { name: "Suspend" }).click();
      const dialogOpen = await page.getByRole("alertdialog").isVisible();
      await page.keyboard.press("Escape");
      const dialogClosed = !(await page.getByRole("alertdialog").isVisible());
      checks.push({
        name: "Users table sort + Dossier Suspend alertdialog & Escape close",
        passed: sortedHeader >= 1 && dialogOpen && dialogClosed,
      });
      await ctx.close();
    }

    // 4. Generations 9-stage filter + Inspector staff privacy guard
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin/generations`, { waitUntil: "load" });
      const stageButtons = await page.locator('section[aria-label="9-stage Beevo generation pipeline"] button').count();
      await page.getByRole("button", { name: /FFmpeg rendering/i }).click();
      const clearVisible = await page.getByRole("button", { name: "Clear stage filter" }).isVisible();
      await page.goto(`${BASE_URL}/admin/generations/inspect`, { waitUntil: "load" });
      const staffNotice = await page.getByText(/Authorized Staff Inspection Only/i).isVisible();
      checks.push({
        name: "Generations 9-stage pipeline strip + Inspector privacy guard",
        passed: stageButtons === 9 && clearVisible && staffNotice,
      });
      await ctx.close();
    }

    // 5. Credits Audited Adjustment Workbench + Confirmation Dialog
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin/credits`, { waitUntil: "load" });
      await page.getByLabel(/Target User/i).fill("creator@example.com");
      await page.getByLabel(/Required Audit Reason/i).fill("Refund for failed render job #1042");
      await page.getByRole("button", { name: /Review & Confirm Adjustment/i }).click();
      const confirmDialog = await page.getByRole("alertdialog").isVisible();
      const disabledBeforePhrase = await page.getByRole("button", { name: "Post Ledger Adjustment" }).isDisabled();
      await page.getByLabel(/Type POST LEDGER to confirm/i).fill("POST LEDGER");
      const enabledAfterPhrase = await page.getByRole("button", { name: "Post Ledger Adjustment" }).isEnabled();
      await page.getByRole("button", { name: "Post Ledger Adjustment" }).click();
      const noticeShown = await page.getByText(/Validated audited add of 100 credits/i).isVisible();
      checks.push({
        name: "Credits audited adjustment review + typed phrase confirm dialog",
        passed: confirmDialog && disabledBeforePhrase && enabledAfterPhrase && noticeShown,
      });
      await ctx.close();
    }

    // 6. Configuration 4 tabs + zero secret inputs + confirmation gate
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin/configuration`, { waitUntil: "load" });
      await page.getByRole("tab", { name: "Credit Rules" }).click();
      const creditRuleVisible = await page.getByLabel("Credits per minute").isVisible();
      await page.getByRole("tab", { name: "Generation Settings" }).click();
      const genVisible = await page.getByText("Supported Aspect Ratios", { exact: true }).isVisible();
      await page.getByRole("tab", { name: "Creative Presets" }).click();
      const presetsVisible = await page.getByText("Cartoon Styles (8 Canonical)").isVisible();
      const secretInputs = await page.locator('input[type="password"]').count();
      await page.getByRole("button", { name: "Save Preset Catalog" }).click();
      const configGate = await page.getByRole("alertdialog").isVisible();
      checks.push({
        name: "Configuration 4 tabs + zero secret inputs + confirmation gate",
        passed: creditRuleVisible && genVisible && presetsVisible && secretInputs === 0 && configGate,
      });
      await ctx.close();
    }

    // 7. Music Library zero fake tracks + register form toggle
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin/music-library`, { waitUntil: "load" });
      const emptyShown = await page.getByText("No licensed tracks uploaded yet").first().isVisible();
      await page.getByRole("button", { name: "Register Licensed Track" }).click();
      const formShown = await page.getByLabel(/License reference \/ Invoice ID/i).isVisible();
      checks.push({
        name: "Music Library empty catalog + Register Licensed Track form",
        passed: emptyShown && formShown,
      });
      await ctx.close();
    }

    // 8. Audit Logs strictly read-only (zero edit/delete buttons)
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: "load" });
      const editOrDeleteCount = await page
        .locator("button")
        .filter({ hasText: /edit|delete|remove|clear logs/i })
        .count();
      const immutableBadge = await page.getByText(/Immutable read-only history/i).isVisible();
      checks.push({
        name: "Audit Logs strictly read-only enforcement",
        passed: editOrDeleteCount === 0 && immutableBadge,
      });
      await ctx.close();
    }

    // 9. Payments read-only guardrail (zero payment status edit selects inside table)
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/admin/payments`, { waitUntil: "load" });
      const readOnlyBadge = await page.getByText(/Payment status is read-only/i).isVisible();
      const tableSelects = await page.locator("table select").count();
      checks.push({
        name: "Payments read-only status guardrail",
        passed: readOnlyBadge && tableSelects === 0,
      });
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  return checks;
}

const matrix = await runMatrix();
const interactive = await runInteractiveChecks();

const summary = {
  totalMatrixChecks: matrix.results.length,
  matrixPassed: matrix.results.filter((r) => r.passed).length,
  matrixFailures: matrix.failures,
  interactiveTotal: interactive.length,
  interactivePassed: interactive.filter((c) => c.passed).length,
  interactiveResults: interactive,
  screenshotsCaptured: fs.readdirSync(OUT_DIR).sort(),
};

fs.writeFileSync(path.join(OUT_DIR, "qa-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

if (matrix.failures.length > 0 || interactive.some((c) => !c.passed)) {
  process.exit(1);
}
