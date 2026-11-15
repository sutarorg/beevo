import fs from "node:fs";
import path from "node:path";
import { chromium as pwChromium } from "playwright";
import sparticuz from "@sparticuz/chromium";

const BASE_URL = "http://127.0.0.1:3000";
const OUT_DIR = path.join(process.cwd(), "qa-screenshots", "phase2");
fs.mkdirSync(OUT_DIR, { recursive: true });

const ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/app",
  "/app/create",
  "/app/projects/draft/storyboard",
  "/app/generations/status",
  "/app/videos",
  "/app/videos/sample",
  "/app/credits",
  "/app/transactions",
  "/app/notifications",
  "/app/settings",
];

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 640 },
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-600", width: 600, height: 900 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1600", width: 1600, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

const SCREENSHOT_PLAN = [
  { route: "/login", viewports: ["mobile-375", "desktop-1440"] },
  { route: "/signup", viewports: ["mobile-375", "desktop-1440"] },
  { route: "/app", viewports: ["mobile-320", "mobile-375", "tablet-768", "desktop-1440", "desktop-1920"] },
  { route: "/app/create", viewports: ["mobile-375", "tablet-768", "tablet-1024", "desktop-1440"] },
  { route: "/app/projects/draft/storyboard", viewports: ["mobile-375", "tablet-768", "desktop-1440"] },
  { route: "/app/generations/status", viewports: ["mobile-375", "desktop-1440"] },
  { route: "/app/videos", viewports: ["mobile-375", "desktop-1440"] },
  { route: "/app/credits", viewports: ["mobile-375", "desktop-1440"] },
  { route: "/app/transactions", viewports: ["mobile-375", "desktop-1440"] },
  { route: "/app/settings", viewports: ["mobile-375", "desktop-1440"] },
];

async function launchBrowser() {
  const ep = await sparticuz.executablePath();
  const safeArgs = [
    ...sparticuz.args.filter((a) => a !== "--single-process"),
    "--disable-dev-shm-usage",
  ];
  return pwChromium.launch({
    executablePath: ep,
    args: safeArgs,
    headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib:/tmp" },
  });
}

async function settlePage(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    const imgs = Array.from(document.querySelectorAll("img")).filter((img) => {
      const st = getComputedStyle(img);
      return st.display !== "none" && st.visibility !== "hidden" && img.offsetParent !== null;
    });
    for (const img of imgs) {
      if (img.loading === "lazy") img.loading = "eager";
    }
    const step = Math.max(500, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 90));
    }
    await Promise.all(
      imgs.map(
        (img) =>
          (img.complete && img.naturalWidth > 0) ||
          new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 6000);
          })
      )
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(150);
}

function slugifyRoute(route) {
  return route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
}

async function runMatrixAudit() {
  const results = [];
  const failures = [];

  for (const route of ROUTES) {
    const browser = await launchBrowser();
    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const consoleErrors = [];
        const pageErrors = [];

        const onConsole = (msg) => {
          if (msg.type() === "error") consoleErrors.push(msg.text());
        };
        const onPageError = (err) => pageErrors.push(String(err));
        page.on("console", onConsole);
        page.on("pageerror", onPageError);

        const resp = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: "load",
          timeout: 30000,
        });
        await settlePage(page);

        const metrics = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;
          const overflowPx = Math.max(0, scrollWidth - innerWidth);
          const visibleImgs = Array.from(document.querySelectorAll("img")).filter((img) => {
            const st = getComputedStyle(img);
            return st.display !== "none" && st.visibility !== "hidden" && img.offsetParent !== null;
          });
          const brokenImgs = visibleImgs
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.getAttribute("src") || img.alt);
          const h1 = document.querySelector("h1");
          const h1Font = h1 ? getComputedStyle(h1).fontFamily : "";
          const bodyFont = getComputedStyle(document.body).fontFamily;
          return {
            scrollWidth,
            innerWidth,
            overflowPx,
            visibleImgCount: visibleImgs.length,
            brokenImgs,
            h1Font,
            bodyFont,
          };
        });

        page.off("console", onConsole);
        page.off("pageerror", onPageError);

        const status = resp ? resp.status() : 0;
        const ok =
          status === 200 &&
          metrics.overflowPx <= 1 &&
          metrics.brokenImgs.length === 0 &&
          consoleErrors.length === 0 &&
          pageErrors.length === 0;

        const row = {
          route,
          viewport: vp.name,
          width: vp.width,
          status,
          overflowPx: metrics.overflowPx,
          visibleImgs: metrics.visibleImgCount,
          brokenImgs: metrics.brokenImgs,
          consoleErrors,
          pageErrors,
          ok,
        };
        results.push(row);
        if (!ok) failures.push(row);
      }
      console.log(`Audited ${route} across all ${VIEWPORTS.length} viewports.`);
      await context.close();
    } finally {
      await browser.close();
    }
  }

  return { results, failures };
}

async function runInteractiveChecks() {
  const browser = await launchBrowser();
  const checks = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 1. Create Video Studio interactive credit calculator & live captions & advanced toggle
    await page.goto(`${BASE_URL}/app/create`, { waitUntil: "load" });
    await settlePage(page);

    await page.getByRole("button", { name: /5m/i }).click();
    const credits5m = await page.locator("text=500 credits").first().isVisible();
    checks.push({ name: "create-duration-5m-credits-500", pass: credits5m });

    await page.getByRole("button", { name: /10m/i }).click();
    const credits10m = await page.locator("text=1,000 credits").first().isVisible();
    checks.push({ name: "create-duration-10m-credits-1000", pass: credits10m });

    await page.getByRole("button", { name: /9:16 Vertical/i }).click();
    const ratioUpdated = await page.locator("text=Viewport 9:16").isVisible();
    checks.push({ name: "create-caption-live-preview-9-16", pass: ratioUpdated });

    await page.getByRole("button", { name: /Advanced Studio Controls/i }).click();
    const advOpen = await page.locator("#advanced-studio-controls").isVisible();
    checks.push({ name: "create-advanced-controls-expand", pass: advOpen });

    // 2. Storyboard interactive blank scene add & honest pending frame
    await page.goto(`${BASE_URL}/app/projects/draft/storyboard`, { waitUntil: "load" });
    await settlePage(page);
    await page.getByRole("button", { name: /Add Blank Scene/i }).click();
    const sceneMounted = await page.locator("text=Planned Frame").first().isVisible();
    checks.push({ name: "storyboard-add-blank-scene", pass: sceneMounted });

    // 3. Auth login honest feedback (no simulated login success)
    await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
    await page.fill("#login-email", "creator@example.com");
    await page.fill("#login-password", "TestPass123");
    await page.getByRole("button", { name: /Log in/i }).click();
    const honestLoginNotice = await page
      .locator("text=Authentication connects in Phase 4")
      .isVisible();
    checks.push({ name: "login-no-simulated-auth-success", pass: honestLoginNotice });

    // 4. Credits pack selection honest notice (no fake purchase confirmation)
    await page.goto(`${BASE_URL}/app/credits`, { waitUntil: "load" });
    await page.getByRole("button", { name: /Select Creator/i }).click();
    const honestCheckout = await page
      .locator("text=Checkout connects in Phase 4")
      .isVisible();
    checks.push({ name: "credits-no-fake-purchase", pass: honestCheckout });

    // 5. Settings guarded account deletion
    await page.goto(`${BASE_URL}/app/settings`, { waitUntil: "load" });
    const delBtn = page.getByRole("button", { name: /Permanently Delete Account/i });
    const initiallyDisabled = await delBtn.isDisabled();
    await page.fill("#delete-account-confirm", "DELETE");
    const unlockedAfterDelete = !(await delBtn.isDisabled());
    checks.push({
      name: "settings-guarded-deletion",
      pass: initiallyDisabled && unlockedAfterDelete,
    });

    // 6. Mobile drawer open & Escape close at 375px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/app`, { waitUntil: "load" });
    await page.getByRole("button", { name: /Open Studio navigation menu/i }).click();
    const drawerVisible = await page.locator("#studio-drawer").isVisible();
    await page.keyboard.press("Escape");
    const drawerClosed = !(await page.locator("#studio-drawer").isVisible());
    checks.push({ name: "mobile-drawer-open-and-escape-close", pass: drawerVisible && drawerClosed });

    await context.close();
  } finally {
    await browser.close();
  }
  return checks;
}

async function captureScreenshots() {
  const captured = [];
  for (const item of SCREENSHOT_PLAN) {
    const browser = await launchBrowser();
    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      for (const vpName of item.viewports) {
        const vp = VIEWPORTS.find((v) => v.name === vpName);
        if (!vp) continue;
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`${BASE_URL}${item.route}`, {
          waitUntil: "load",
          timeout: 30000,
        });
        await settlePage(page);

        const baseName = `${slugifyRoute(item.route)}__${vp.name}.png`;
        const filePath = path.join(OUT_DIR, baseName);
        await page.screenshot({ path: filePath, fullPage: false });
        captured.push(baseName);

        // Also capture scrolled middle/lower slice for /app/create desktop to inspect style cards & live caption preview
        if (item.route === "/app/create" && vp.name === "desktop-1440") {
          await page.evaluate(() => window.scrollTo({ top: 1250, behavior: "instant" }));
          await page.waitForTimeout(200);
          const stylesShot = "app_create__desktop-1440__styles.png";
          await page.screenshot({ path: path.join(OUT_DIR, stylesShot), fullPage: false });
          captured.push(stylesShot);

          await page.evaluate(() => window.scrollTo({ top: 2700, behavior: "instant" }));
          await page.waitForTimeout(200);
          const captionsShot = "app_create__desktop-1440__captions.png";
          await page.screenshot({ path: path.join(OUT_DIR, captionsShot), fullPage: false });
          captured.push(captionsShot);
        }
      }
      await context.close();
    } finally {
      await browser.close();
    }
  }
  return captured;
}

(async () => {
  console.log("=== Phase 2 Matrix Audit (14 routes x 13 viewports = 182 checks) ===");
  const { results, failures } = await runMatrixAudit();

  console.log("=== Phase 2 Interactive Functional Checks ===");
  const checks = await runInteractiveChecks();

  console.log("=== Phase 2 Visual Screenshot Capture ===");
  const screenshots = await captureScreenshots();

  const summary = {
    totalMatrixChecks: results.length,
    passedMatrixChecks: results.length - failures.length,
    failedMatrixChecks: failures.length,
    failures,
    interactiveChecks: checks,
    screenshots,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "qa-report.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        totalMatrixChecks: summary.totalMatrixChecks,
        passedMatrixChecks: summary.passedMatrixChecks,
        failedMatrixChecks: summary.failedMatrixChecks,
        interactiveChecks: summary.interactiveChecks,
        screenshotCount: screenshots.length,
      },
      null,
      2
    )
  );

  if (failures.length > 0 || checks.some((c) => !c.pass)) {
    console.error("QA FAILURES DETECTED:", JSON.stringify(failures, null, 2));
    process.exit(1);
  }
})();
