import fs from "node:fs";
import path from "node:path";
import { chromium as pwChromium } from "playwright";
import sparticuz from "@sparticuz/chromium";

const BASE_URL = "http://127.0.0.1:3000";
const OUT_DIR = path.join(process.cwd(), "qa-screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

const ALL_PUBLIC_ROUTES = [
  "/",
  "/features",
  "/how-it-works",
  "/pricing",
  "/use-cases/education",
  "/use-cases/content-creators",
  "/use-cases/business-explainers",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
];

const NOINDEX_ROUTES = ["/login", "/get-started"];

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
  { name: "ref-941", width: 941, height: 1672 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1600", width: 1600, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
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
    // Force eager decode of all visible images in the DOM so lazy scrolling never aborts them
    const imgs = Array.from(document.querySelectorAll("img")).filter((img) => {
      const st = getComputedStyle(img);
      return st.display !== "none" && st.visibility !== "hidden" && img.offsetParent !== null;
    });
    for (const img of imgs) {
      if (img.loading === "lazy") {
        img.loading = "eager";
      }
    }
    const step = Math.max(450, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 40));
    }
    await Promise.race([
      Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              })
        )
      ),
      new Promise((r) => setTimeout(r, 6000)),
    ]);
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.waitForTimeout(120);
}

async function run() {
  const report = {
    consoleErrors: [],
    pageErrors: [],
    routeAudits: [],
    viewportAudits: [],
    touchTargetAudit: null,
    interactionChecks: {},
    technicalEndpoints: {},
  };

  const browser = await launchBrowser();
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  let ignore404Console = false;
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      if (ignore404Console && msg.text().includes("status of 404")) return;
      report.consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    report.pageErrors.push({ url: page.url(), text: err.message });
  });

  // 1) Audit all 14 routes on Desktop 1280
  console.log("[1/5] Auditing all 14 routes...");
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const route of [...ALL_PUBLIC_ROUTES, ...NOINDEX_ROUTES]) {
    const res = await page.goto(`${BASE_URL}${route}`, { waitUntil: "load", timeout: 25000 });
    await settlePage(page);

    const audit = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img")).filter((img) => {
        const st = getComputedStyle(img);
        return st.display !== "none" && st.visibility !== "hidden" && img.offsetParent !== null;
      });
      const brokenImgs = imgs
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.getAttribute("src"));
      const missingAlt = Array.from(document.querySelectorAll("img"))
        .filter((img) => img.getAttribute("alt") === null)
        .map((img) => img.getAttribute("src"));
      const h1s = Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim());
      const title = document.title;
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content");
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
      const jsonLdCount = document.querySelectorAll('script[type="application/ld+json"]').length;
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        title,
        metaDescLen: metaDesc?.length ?? 0,
        canonical,
        robots,
        hasOg: Boolean(ogTitle && ogImage),
        h1Count: h1s.length,
        h1Text: h1s[0] ?? "",
        visibleImgCount: imgs.length,
        brokenImgs,
        missingAlt,
        jsonLdCount,
        overflow,
      };
    });

    report.routeAudits.push({ route, status: res?.status(), ...audit });
  }

  // 2) Check robots.txt, sitemap.xml, redirects, and 404 page
  console.log("[2/5] Checking technical endpoints & redirects...");
  for (const epPath of ["/robots.txt", "/sitemap.xml", "/does-not-exist-404"]) {
    ignore404Console = epPath === "/does-not-exist-404";
    const res = await page.goto(`${BASE_URL}${epPath}`, { waitUntil: "load" });
    const body = await page.content();
    report.technicalEndpoints[epPath] = {
      status: res?.status(),
      length: body.length,
      hasExpected:
        epPath === "/robots.txt"
          ? body.includes("Sitemap:") && body.includes("Disallow: /admin/")
          : epPath === "/sitemap.xml"
          ? body.includes("/pricing") && !body.includes("/login") && !body.includes("/get-started")
          : body.includes("404"),
    };
  }
  ignore404Console = false;

  for (const redirPath of ["/use-cases", "/examples"]) {
    const res = await page.goto(`${BASE_URL}${redirPath}`, { waitUntil: "load" });
    report.technicalEndpoints[`redirect:${redirPath}`] = {
      status: res?.status(),
      finalUrl: page.url(),
    };
  }

  // 3) Responsive Homepage Viewport Matrix (all 14 widths)
  console.log("[3/5] Auditing all 14 responsive viewports...");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
  await settlePage(page);

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await settlePage(page);

    const vpAudit = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const innerW = window.innerWidth;
      const imgs = Array.from(document.querySelectorAll("img")).filter((i) => {
        const st = getComputedStyle(i);
        return st.display !== "none" && st.visibility !== "hidden" && i.offsetParent !== null;
      });
      const brokenVisible = imgs
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((i) => i.src);
      const h1 = document.querySelector("h1");
      const h1Style = h1 ? getComputedStyle(h1) : null;
      const bodyStyle = getComputedStyle(document.body);
      const header = document.querySelector("header");
      const headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
      const signpostSpan = document.querySelector('ol[aria-label*="Three-step"] li span');
      const signpostColor = signpostSpan ? getComputedStyle(signpostSpan).color : null;
      return {
        scrollW,
        innerW,
        overflow: scrollW > innerW,
        headerHeight,
        visibleImgs: imgs.length,
        brokenVisible,
        h1Font: h1Style?.fontFamily,
        h1Size: h1Style?.fontSize,
        bodyFont: bodyStyle.fontFamily,
        bodySize: bodyStyle.fontSize,
        signpostColor,
      };
    });

    report.viewportAudits.push({ viewport: vp.name, width: vp.width, ...vpAudit });

    if (vp.name === "mobile-390") {
      report.touchTargetAudit = await page.evaluate(() => {
        const els = Array.from(
          document.querySelectorAll("a, button, input, select, textarea, summary")
        ).filter((el) => {
          if (el.classList.contains("sr-only")) return false;
          const st = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return (
            st.display !== "none" &&
            st.visibility !== "hidden" &&
            el.offsetParent !== null &&
            rect.width > 1 &&
            rect.height > 1
          );
        });
        const undersized = els
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40),
              w: Math.round(r.width),
              h: Math.round(r.height),
            };
          })
          .filter((item) => item.h < 44 || item.w < 44);
        return { totalInteractive: els.length, undersizedCount: undersized.length, undersized };
      });
    }
  }

  // 4) Interactive UI Checks
  console.log("[4/5] Running interactive UI checks...");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
  await page.getByRole("button", { name: /Watch Demo/i }).click();
  await page.waitForTimeout(200);
  const modalVisible = await page.getByRole("dialog").isVisible();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const modalClosedOnEsc = !(await page.getByRole("dialog").isVisible());
  report.interactionChecks.demoModal = { modalVisible, modalClosedOnEsc };

  const firstFaqBtn = page.locator("#faq button[aria-expanded]").first();
  const initialExpanded = await firstFaqBtn.getAttribute("aria-expanded");
  await firstFaqBtn.click();
  await page.waitForTimeout(100);
  const toggledExpanded = await firstFaqBtn.getAttribute("aria-expanded");
  report.interactionChecks.faqAccordion = { initialExpanded, toggledExpanded };

  const comicBtn = page.getByRole("button", { name: /Comic Book/i }).first();
  await comicBtn.click();
  await page.waitForTimeout(100);
  const comicPressed = await comicBtn.getAttribute("aria-pressed");
  report.interactionChecks.styleShowcase = { comicPressed };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /Open navigation menu/i }).click();
  await page.waitForTimeout(200);
  const drawerOpen = await page.locator("#mobile-nav-drawer").isVisible();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  const drawerClosed = !(await page.locator("#mobile-nav-drawer").isVisible());
  report.interactionChecks.mobileDrawer = { drawerOpen, drawerClosed };

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/pricing`, { waitUntil: "load" });
  const initialCalcText = await page.locator("text=600 credits").first().isVisible();
  report.interactionChecks.pricingCalculator = { initialCalcText };

  await page.goto(`${BASE_URL}/contact`, { waitUntil: "load" });
  await page.fill("#contact-name", "Priya Nair");
  await page.fill("#contact-email", "priya@example.com");
  await page.fill("#contact-message", "Checking classroom credit pack options for science lessons.");
  await page.getByRole("button", { name: /Send Message/i }).click();
  await page.waitForTimeout(150);
  const contactSuccess = await page.getByRole("status").isVisible();
  report.interactionChecks.contactForm = { contactSuccess };

  await browser.close();

  // 5) Clean Dedicated Screenshot Captures (fresh browser per capture to avoid SwiftShader artifacts)
  console.log("[5/5] Capturing verified visual QA screenshots...");
  const shots = [
    { url: "/", name: "home-ref-941-fold.png", w: 941, h: 1672, fullPage: false },
    { url: "/", name: "home-desktop-1280-fold.png", w: 1280, h: 900, fullPage: false },
    { url: "/", name: "home-desktop-1280-top6.png", w: 1280, h: 2550, fullPage: false },
    { url: "/", name: "home-tablet-768-fold.png", w: 768, h: 1024, fullPage: false },
    { url: "/", name: "home-mobile-390-fold.png", w: 390, h: 844, fullPage: false },
    { url: "/", name: "home-mobile-320-fold.png", w: 320, h: 640, fullPage: false },
    {
      url: "/",
      name: "home-desktop-1280-styles.png",
      w: 1280,
      h: 1100,
      scrollToSelector: "#visual-styles",
    },
    {
      url: "/",
      name: "home-desktop-1280-bottom.png",
      w: 1280,
      h: 1450,
      scrollToBottom: true,
    },
  ];

  for (const shot of shots) {
    const b = await launchBrowser();
    const c = await b.newContext({ viewport: { width: shot.w, height: shot.h }, deviceScaleFactor: 1 });
    const p = await c.newPage();
    await p.goto(`${BASE_URL}${shot.url}`, { waitUntil: "load", timeout: 25000 });
    await settlePage(p);
    if (shot.scrollToSelector) {
      await p.locator(shot.scrollToSelector).scrollIntoViewIfNeeded();
      await p.waitForTimeout(250);
    } else if (shot.scrollToBottom) {
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await p.waitForTimeout(250);
    }
    await p.screenshot({ path: path.join(OUT_DIR, shot.name), fullPage: Boolean(shot.fullPage) });
    await b.close();
    console.log(`  captured ${shot.name}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, "qa-report.json"), JSON.stringify(report, null, 2));
  console.log("=== QA SUMMARY ===");
  console.log("Console errors:", report.consoleErrors.length);
  console.log("Page errors:", report.pageErrors.length);
  console.log(
    "Routes with broken images:",
    report.routeAudits.filter((r) => r.brokenImgs.length > 0).map((r) => r.route)
  );
  console.log(
    "Viewports with broken images:",
    report.viewportAudits.filter((v) => v.brokenVisible.length > 0).map((v) => v.viewport)
  );
  console.log(
    "Routes with non-200 status:",
    report.routeAudits.filter((r) => r.status !== 200).map((r) => `${r.route}:${r.status}`)
  );
  console.log(
    "Viewports with horizontal overflow:",
    report.viewportAudits
      .filter((v) => v.overflow)
      .map((v) => `${v.viewport}(${v.scrollW}>${v.innerW})`)
  );
  console.log("Touch targets undersized on 390px:", report.touchTargetAudit?.undersizedCount);
  console.log(
    "Desktop signpost text color:",
    report.viewportAudits.find((v) => v.viewport === "desktop-1280")?.signpostColor
  );
  console.log("Technical endpoints:", report.technicalEndpoints);
  console.log("Interaction checks:", report.interactionChecks);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
