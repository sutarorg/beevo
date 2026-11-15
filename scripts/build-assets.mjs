import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium as pwChromium } from "playwright";
import sparticuz from "@sparticuz/chromium";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "assets-src", "beevo");
const OUT_DIR = path.join(ROOT, "public", "images", "beevo");
const QA_DIR = path.join(ROOT, "qa-screenshots");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(QA_DIR, { recursive: true });

// Flood-fill uniform edge background removal using sharp raw pixels
async function removeEdgeBackground(inputPath, outputPngPath, tolerance = 28) {
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const buf = Buffer.from(data);

  const sampleCoords = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  let br = 0,
    bg = 0,
    bb = 0;
  for (const [x, y] of sampleCoords) {
    const idx = (y * width + x) * channels;
    br += buf[idx];
    bg += buf[idx + 1];
    bb += buf[idx + 2];
  }
  br /= 4;
  bg /= 4;
  bb /= 4;

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0,
    tail = 0;

  const isBg = (pIdx) => {
    const o = pIdx * channels;
    const dr = buf[o] - br;
    const dg = buf[o + 1] - bg;
    const db = buf[o + 2] - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= tolerance;
  };

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    if (isBg(p)) {
      visited[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    buf[p * channels + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (!visited[p]) {
        const adjBg =
          visited[p - 1] || visited[p + 1] || visited[p - width] || visited[p + width];
        if (adjBg) {
          const o = p * channels;
          const dr = buf[o] - br;
          const dg = buf[o + 1] - bg;
          const db = buf[o + 2] - bb;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          if (dist < tolerance * 2.2) {
            const alpha = Math.max(
              0,
              Math.min(255, Math.round(((dist - tolerance * 0.7) / (tolerance * 1.5)) * 255))
            );
            buf[o + 3] = Math.min(buf[o + 3], alpha);
          }
        }
      }
    }
  }

  await sharp(buf, { raw: { width, height, channels } })
    .trim({ threshold: 12 })
    .png()
    .toFile(outputPngPath);
}

function toDataUri(filePath, mime = "image/png") {
  return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

async function main() {
  console.log("1) Optimizing all 24 native AI-generated source PNGs into 25 production WebP assets...");

  // Hero desktop & mobile
  await sharp(path.join(SRC_DIR, "hero-beevo-desktop.png"))
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(path.join(OUT_DIR, "hero-beevo-desktop.webp"));

  await sharp(path.join(SRC_DIR, "hero-beevo-mobile.png"))
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(path.join(OUT_DIR, "hero-beevo-mobile.webp"));

  // Master mascot reference
  await sharp(path.join(SRC_DIR, "beevo-mascot-reference.png"))
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(path.join(OUT_DIR, "beevo-mascot-reference.webp"));

  // Step props — trim excess white & normalize to clean centered 640x460 on pure white
  for (const name of ["step-describe", "step-generate", "step-download"]) {
    const trimmed = await sharp(path.join(SRC_DIR, `${name}.png`))
      .trim({ threshold: 18 })
      .resize({ width: 520, height: 380, fit: "inside" })
      .toBuffer();

    await sharp({
      create: {
        width: 640,
        height: 460,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: trimmed, gravity: "center" }])
      .webp({ quality: 90 })
      .toFile(path.join(OUT_DIR, `${name}.webp`));
  }

  // Flying bee doodle (transparent cutout)
  const flyingCutout = path.join(SRC_DIR, "_flying-cutout.png");
  await removeEdgeBackground(path.join(SRC_DIR, "bee-flight-doodle.png"), flyingCutout, 28);
  await sharp(flyingCutout)
    .resize({ width: 320, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(path.join(OUT_DIR, "bee-flight-doodle.webp"));

  // Final CTA celebratory bee (transparent cutout)
  const ctaCutout = path.join(SRC_DIR, "_cta-cutout.png");
  await removeEdgeBackground(path.join(SRC_DIR, "final-cta-beevo.png"), ctaCutout, 28);
  await sharp(ctaCutout)
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(path.join(OUT_DIR, "final-cta-beevo.webp"));

  // Intelligent storyboard
  await sharp(path.join(SRC_DIR, "intelligent-storyboard.png"))
    .resize({ width: 1440, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(path.join(OUT_DIR, "intelligent-storyboard.webp"));

  // ALL 4 Native AI Example Video Thumbnails (1280x720 16:9 WebP)
  for (const name of [
    "example-bee-life",
    "example-save-planet",
    "example-solar-system",
    "example-healthy-habits",
  ]) {
    await sharp(path.join(SRC_DIR, `${name}.png`))
      .resize({ width: 1280, height: 720, fit: "cover", position: "center" })
      .webp({ quality: 88 })
      .toFile(path.join(OUT_DIR, `${name}.webp`));
  }

  // ALL 8 Native AI Same-Subject Visual Style Showcase Plates (1280x720 16:9 WebP)
  const stylePairs = [
    ["example-bee-life.png", "style-3d-cartoon.webp"],
    ["style-2d-cartoon.png", "style-2d-cartoon.webp"],
    ["style-anime-inspired.png", "style-anime-inspired.webp"],
    ["style-storybook.png", "style-storybook.webp"],
    ["style-clay-animation.png", "style-clay-animation.webp"],
    ["style-comic-book.png", "style-comic-book.webp"],
    ["style-watercolor.png", "style-watercolor.webp"],
    ["style-flat-vector.png", "style-flat-vector.webp"],
  ];
  for (const [srcName, outName] of stylePairs) {
    await sharp(path.join(SRC_DIR, srcName))
      .resize({ width: 1280, height: 720, fit: "cover", position: "center" })
      .webp({ quality: 88 })
      .toFile(path.join(OUT_DIR, outName));
  }

  // ALL 3 Native AI Use-Case Editorial Illustrations (1280x720 16:9 WebP)
  for (const name of ["usecase-education", "usecase-creators", "usecase-business"]) {
    await sharp(path.join(SRC_DIR, `${name}.png`))
      .resize({ width: 1280, height: 720, fit: "cover", position: "center" })
      .webp({ quality: 88 })
      .toFile(path.join(OUT_DIR, `${name}.webp`));
  }

  // Native AI 1:1 Square Social Share Portrait (1080x1080 WebP)
  await sharp(path.join(SRC_DIR, "social-share-beevo.png"))
    .resize({ width: 1080, height: 1080, fit: "cover", position: "center" })
    .webp({ quality: 88 })
    .toFile(path.join(OUT_DIR, "social-share-beevo.webp"));

  console.log("2) Rendering crisp Open Graph card (og-beevo.png) & 26-asset Contact Sheet...");
  const ep = await sparticuz.executablePath();
  const safeArgs = [
    ...sparticuz.args.filter((a) => a !== "--single-process"),
    "--disable-dev-shm-usage",
  ];
  const browser = await pwChromium.launch({
    executablePath: ep,
    args: safeArgs,
    headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib:/tmp" },
  });
  const sharedPage = await browser.newPage();

  const heroDeskUri = toDataUri(path.join(SRC_DIR, "hero-beevo-desktop.png"));

  async function renderToFile(html, width, height, outPath, format = "png") {
    await sharedPage.setViewportSize({ width, height });
    await sharedPage.setContent(html, { waitUntil: "load" });
    await sharedPage.waitForTimeout(100);
    const pngBuf = await sharedPage.screenshot({ type: "png" });
    if (format === "png") {
      await sharp(pngBuf).png({ compressionLevel: 8 }).toFile(outPath);
    } else {
      await sharp(pngBuf).webp({ quality: 88 }).toFile(outPath);
    }
  }

  // Branded Open Graph / Twitter share card (1200x630 PNG, crisp HTML/SVG typography + native AI hero)
  await renderToFile(
    `<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:#FFFEFB;font-family:system-ui,-apple-system,sans-serif;overflow:hidden;">
      <div style="position:relative;width:1200px;height:630px;background:linear-gradient(120deg,#FFFEFB 0%,#FFF9E9 100%);display:flex;align-items:center;overflow:hidden;">
        <div style="position:relative;z-index:2;width:54%;padding:56px 0 56px 68px;box-sizing:border-box;">
          <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:26px;">
            <svg width="36" height="36" viewBox="0 0 32 32"><ellipse cx="10.5" cy="9.5" rx="5.2" ry="3.4" transform="rotate(-28 10.5 9.5)" fill="#FFFDF5" stroke="#171717" stroke-width="2.2"/><ellipse cx="21.5" cy="9.5" rx="5.2" ry="3.4" transform="rotate(28 21.5 9.5)" fill="#FFFDF5" stroke="#171717" stroke-width="2.2"/><rect x="8.5" y="10.5" width="15" height="17" rx="7.5" fill="#FFC928" stroke="#171717" stroke-width="2.2"/><line x1="9.5" y1="16.5" x2="22.5" y2="16.5" stroke="#171717" stroke-width="2.6"/><line x1="10" y1="21.5" x2="22" y2="21.5" stroke="#171717" stroke-width="2.6"/></svg>
            <span style="font-size:32px;font-weight:800;letter-spacing:-0.04em;color:#171717;">beevo</span>
          </div>
          <div style="display:inline-block;padding:6px 14px;border-radius:10px;border:1.5px solid #F3DF9E;background:#FFFDF5;color:#B87800;font-size:15px;font-weight:700;margin-bottom:18px;">AI Cartoon Video Generator</div>
          <h1 style="margin:0 0 18px;font-size:52px;line-height:1.1;letter-spacing:-0.04em;font-weight:800;color:#171717;">Turn your ideas<br/><span style="color:#DF9E00;">into cartoon videos</span><br/>in minutes.</h1>
          <p style="margin:0;font-size:20px;line-height:1.5;color:#4a463e;max-width:470px;">Scripts, dynamic storyboards, original illustrations, natural voiceover &amp; music — with simple one-time credit packs.</p>
        </div>
        <div style="position:absolute;right:0;top:0;bottom:0;width:54%;overflow:hidden;">
          <img src="${heroDeskUri}" style="width:100%;height:100%;object-fit:cover;object-position:62% center;"/>
          <div style="position:absolute;inset:0;background:linear-gradient(90deg,#FFFBF0 0%,rgba(255,251,240,0) 32%);"></div>
        </div>
      </div>
    </body></html>`,
    1200,
    630,
    path.join(OUT_DIR, "og-beevo.png"),
    "png"
  );

  // Full 26-Asset Visual Contact Sheet
  const allOut = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".webp") || f.endsWith(".png"))
    .sort();
  const tiles = allOut
    .map((f) => {
      const mime = f.endsWith(".png") ? "image/png" : "image/webp";
      const uri = toDataUri(path.join(OUT_DIR, f), mime);
      return `<div style="background:#fff;border:1px solid #e5decb;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px;">
        <div style="height:140px;display:flex;align-items:center;justify-content:center;background:#faf7ef;border-radius:8px;overflow:hidden;">
          <img src="${uri}" style="max-width:100%;max-height:100%;object-fit:contain;"/>
        </div>
        <div style="font:600 12px/1.3 system-ui,sans-serif;color:#171717;word-break:break-all;">${f}</div>
      </div>`;
    })
    .join("");

  await renderToFile(
    `<!doctype html><html><body style="margin:0;padding:24px;background:#f7f3e8;width:1440px;box-sizing:border-box;">
      <h2 style="margin:0 0 16px;font:700 22px system-ui,sans-serif;color:#171717;">Beevo Asset Contact Sheet (${allOut.length} assets — 100% Complete Native AI Suite)</h2>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;">${tiles}</div>
    </body></html>`,
    1440,
    Math.ceil(allOut.length / 5) * 195 + 90,
    path.join(QA_DIR, "asset-contact-sheet.png"),
    "png"
  );

  await browser.close();
  console.log(
    `Done! Exported ${allOut.length} production assets to public/images/beevo/ and updated qa-screenshots/asset-contact-sheet.png`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
