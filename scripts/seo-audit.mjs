#!/usr/bin/env node
/**
 * Beevo SEO audit — a dependency-free smoke test for the metadata surfaces.
 *
 * Usage:
 *   node scripts/seo-audit.mjs                     # audits http://localhost:3000
 *   BASE_URL=https://beevo.in node scripts/seo-audit.mjs
 *   SITE_ORIGIN=https://beevo.in BASE_URL=http://localhost:3000 node scripts/seo-audit.mjs
 *
 * What it checks:
 *   - robots.txt exists, references the sitemap, and blocks API noise only;
 *   - sitemap.xml is valid-ish XML, absolute, duplicate-free, on the canonical
 *     origin, and only lists URLs that answer 200;
 *   - every sitemap page has exactly one title, description, canonical,
 *     Open Graph set, Twitter card, JSON-LD block set, and <h1>;
 *   - JSON-LD blocks parse as JSON;
 *   - private pages (auth + dashboards) are `noindex` in both the meta tag and
 *     the X-Robots-Tag header;
 *   - a nonexistent URL answers 404 (no soft-404).
 *
 * Exit code is non-zero when any check fails, so it can run in CI.
 */

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const ORIGIN = (process.env.SITE_ORIGIN || "https://beevo.in").replace(/\/$/, "");

const PRIVATE_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/creator/dashboard",
  "/learn/courses",
  "/admin/dashboard",
];

const failures = [];

const pass = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const fail = (msg) => {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  failures.push(msg);
};

function countMatches(html, regex) {
  return [...html.matchAll(regex)].length;
}

function extract(html, regex) {
  return [...html.matchAll(regex)].map((match) => match[1]);
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}

async function get(path) {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return { response, body: await response.text() };
}

async function auditRobots() {
  console.log("\nrobots.txt");
  const { response, body } = await get("/robots.txt");
  if (response.status !== 200) return fail(`status ${response.status}`);
  pass(`status 200 (${response.headers.get("content-type")})`);
  if (!/Sitemap:\s*https?:\/\/\S+/.test(body)) fail("missing Sitemap: line");
  else pass("references sitemap.xml");
  if (/Disallow:\s*\/creator/.test(body) || /Disallow:\s*\/learn/.test(body)) {
    fail("blocks private pages in robots.txt (noindex must stay crawlable)");
  } else {
    pass("private pages are not robots-blocked");
  }
  if (!/Disallow:\s*\/api\//.test(body)) fail("does not block /api/ crawl noise");
  else pass("blocks /api/ crawl noise");
}

async function sitemapUrls() {
  console.log("\nsitemap.xml");
  const { response, body } = await get("/sitemap.xml");
  if (response.status !== 200) {
    fail(`status ${response.status}`);
    return [];
  }
  pass(`status 200 (${response.headers.get("content-type")})`);
  const locs = extract(body, /<loc>([^<]+)<\/loc>/g).map(decodeEntities);
  if (locs.length === 0) fail("no <loc> entries");
  else pass(`${locs.length} URLs`);
  const duplicates = locs.filter((loc, index) => locs.indexOf(loc) !== index);
  if (duplicates.length) fail(`duplicate URLs: ${duplicates.join(", ")}`);
  else pass("no duplicate URLs");
  const offOrigin = locs.filter((loc) => !loc.startsWith(ORIGIN));
  if (offOrigin.length) fail(`URLs off the canonical origin: ${offOrigin.join(", ")}`);
  else pass(`all URLs on ${ORIGIN}`);
  return locs;
}

async function auditPage(url) {
  const path = url.startsWith(ORIGIN) ? url.slice(ORIGIN.length) || "/" : url;
  const { response, body } = await get(path);
  const label = path;
  if (response.status !== 200) return fail(`${label} → status ${response.status}`);

  const titleCount = countMatches(body, /<title[^>]*>[\s\S]*?<\/title>/g);
  const descCount = countMatches(body, /<meta name="description"/g);
  const canonicalCount = countMatches(body, /<link rel="canonical"/g);
  const ogTitle = countMatches(body, /<meta property="og:title"/g);
  const ogDesc = countMatches(body, /<meta property="og:description"/g);
  const ogUrl = countMatches(body, /<meta property="og:url"/g);
  const ogImage = countMatches(body, /<meta property="og:image"/g);
  const twitter = countMatches(body, /<meta name="twitter:card"/g);
  const h1 = countMatches(body, /<h1[\s>]/g);
  const ld = extract(body, /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
  const robotsMeta = extract(body, /<meta name="robots" content="([^"]+)"/g).join(",");
  const canonical = extract(body, /<link rel="canonical" href="([^"]+)"/g)[0] ?? "";
  const description = decodeEntities(
    extract(body, /<meta name="description" content="([^"]*)"/g)[0] ?? "",
  );
  const problems = [];

  if (titleCount !== 1) problems.push(`${titleCount} <title>`);
  if (descCount !== 1) problems.push(`${descCount} descriptions`);
  if (canonicalCount !== 1) problems.push(`${canonicalCount} canonicals`);
  if (ogTitle !== 1) problems.push(`${ogTitle} og:title`);
  if (ogDesc !== 1) problems.push(`${ogDesc} og:description`);
  if (ogUrl !== 1) problems.push(`${ogUrl} og:url`);
  if (ogImage < 1) problems.push(`${ogImage} og:image`);
  if (twitter !== 1) problems.push(`${twitter} twitter:card`);
  if (h1 !== 1) problems.push(`${h1} <h1>`);
  if (ld.length === 0) problems.push("no JSON-LD");
  if (!/index/.test(robotsMeta) || /noindex/.test(robotsMeta)) {
    problems.push(`robots meta "${robotsMeta || "missing"}"`);
  }
  if (!canonical.startsWith(ORIGIN)) problems.push(`canonical outside origin: ${canonical}`);
  if (description.length < 50 || description.length > 180) {
    problems.push(`description length ${description.length}`);
  }
  for (const block of ld) {
    try {
      JSON.parse(block);
    } catch {
      problems.push("invalid JSON-LD");
    }
  }
  if (!/<html[^>]+lang="[a-z-]+"/i.test(body)) problems.push("missing <html lang>");

  if (problems.length) fail(`${label}: ${problems.join("; ")}`);
  else pass(`${label} — title, description, canonical, OG, Twitter, JSON-LD, h1, lang`);
}

async function auditPrivate() {
  console.log("\nPrivate pages (must be noindex)");
  for (const path of PRIVATE_PATHS) {
    const { response, body } = await get(path);
    const metaRobots = extract(body, /<meta name="robots" content="([^"]+)"/g).join(",");
    const header = response.headers.get("x-robots-tag") ?? "";
    if (response.status !== 200) {
      fail(`${path} → status ${response.status}`);
    } else if (!/noindex/.test(metaRobots) || !/noindex/i.test(header)) {
      fail(`${path} → meta "${metaRobots || "missing"}", header "${header || "missing"}"`);
    } else {
      pass(`${path} → noindex (meta + header)`);
    }
  }
}

async function audit404() {
  console.log("\n404 handling");
  const { response } = await get("/this-page-should-not-exist-9f3a");
  if (response.status === 404) pass("unknown path → 404");
  else fail(`unknown path → ${response.status} (soft 404 risk)`);
}

async function main() {
  console.log(`SEO audit — ${BASE} (canonical origin ${ORIGIN})`);
  await auditRobots();
  const urls = await sitemapUrls();

  console.log("\nSitemap pages");
  for (const url of urls) {
    await auditPage(url);
  }

  await auditPrivate();
  await audit404();

  console.log("");
  if (failures.length) {
    console.error(`\x1b[31m${failures.length} check(s) failed.\x1b[0m`);
    process.exitCode = 1;
  } else {
    console.log("\x1b[32mAll SEO checks passed.\x1b[0m");
  }
}

main().catch((error) => {
  console.error("SEO audit crashed:", error);
  process.exitCode = 1;
});
