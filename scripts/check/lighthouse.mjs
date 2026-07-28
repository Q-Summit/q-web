#!/usr/bin/env node
/**
 * Local Lighthouse mobile loop for quality goal Q1
 * (docs/architecture/10-quality-requirements.md).
 *
 *   make lighthouse                         # prod-shaped (no Picture sync)
 *   make lighthouse ARGS='--with-picture'   # local Astro <Picture>
 *   pnpm run lighthouse -- --mode=astro --skip-build --urls=/
 *   pnpm run lighthouse -- --runs=3
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as chromeLauncher from "chrome-launcher";
import lighthouse, { defaultConfig } from "lighthouse";

import { argValue, hasFlag } from "../lib/args.mjs";
import { REPO_ROOT, WEB_DIR } from "../lib/paths.mjs";
import { runCommandSync } from "../lib/run.mjs";
import { ensureChrome } from "../local/ensure-chrome.mjs";
import { seedLocalR2 } from "../preview/seed-local-r2.mjs";
import { startAstroPreview, startWranglerDev } from "../preview/serve.mjs";
import { syncPictureAssets } from "../preview/sync-picture-assets.mjs";
import { extractFindings, formatAgentMarkdown } from "./lighthouse-report.mjs";
import { parseLighthouseUrls } from "./lighthouse-urls.mjs";

const OUT_DIR = path.join(REPO_ROOT, ".lighthouse");
const DEFAULT_MIN_PERFORMANCE = 90;
const DEFAULT_MIN_ACCESSIBILITY = 90;
const DEFAULT_MIN_BEST_PRACTICES = 90;
const DEFAULT_MIN_SEO = 90;

function parseEqualsOrNext(flag, argv = process.argv) {
  const args = argv.filter((a) => a !== "--");
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  return argValue(flag, argv);
}

function parseMode(argv = process.argv) {
  const raw = (parseEqualsOrNext("--mode", argv) || "cf").toLowerCase();
  if (raw !== "cf" && raw !== "astro") {
    throw new Error(`--mode must be "cf" or "astro" (got ${raw})`);
  }
  return raw;
}

function parseRuns(argv = process.argv) {
  const raw = parseEqualsOrNext("--runs", argv);
  if (raw == null) return 1;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error(`--runs must be an integer 1..5 (got ${raw})`);
  }
  return n;
}

function slugFor(urlPath) {
  return urlPath.replace(/^\//, "").replace(/\/+$/, "") || "home";
}

/**
 * Pick median run by performance score (simple; good enough for local loop).
 * For production CI, Lighthouse recommends computeMedianRun on full LHRs.
 * @param {object[]} findingsList
 */
function pickMedianFindings(findingsList) {
  if (findingsList.length === 1) return findingsList[0];
  const sorted = [...findingsList].sort(
    (a, b) => (a.scores.performance ?? 0) - (b.scores.performance ?? 0),
  );
  return sorted[Math.floor(sorted.length / 2)];
}

async function runLighthouseOnce(chrome, pageUrl) {
  // Use Lighthouse's shipped mobile defaults (Slow 4G simulate, moto g power)
  // rather than hand-rolling screen/throttling that can drift from upstream.
  const result = await lighthouse(
    pageUrl,
    {
      port: chrome.port,
      output: ["html", "json"],
      logLevel: "error",
    },
    {
      ...defaultConfig,
      settings: {
        ...defaultConfig.settings,
        formFactor: "mobile",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        // Keep default throttlingMethod + throttling + screenEmulation.
      },
    },
  );

  const reports = Array.isArray(result.report)
    ? result.report
    : [result.report];
  const html =
    reports.find((r) => typeof r === "string" && r.includes("<!DOCTYPE")) ??
    reports[0];
  const json =
    reports.find(
      (r) => typeof r === "string" && r.trimStart().startsWith("{"),
    ) ?? JSON.stringify(result.lhr, null, 2);

  return { lhr: result.lhr, html, json, findings: extractFindings(result.lhr) };
}

async function auditUrl(chrome, baseUrl, urlPath, thresholds, runs) {
  const pageUrl = new URL(urlPath, baseUrl).href;
  const runResults = [];
  for (let i = 0; i < runs; i += 1) {
    if (runs > 1) console.log(`  run ${i + 1}/${runs}…`);
    runResults.push(await runLighthouseOnce(chrome, pageUrl));
  }

  const median = pickMedianFindings(runResults.map((r) => r.findings));
  // Prefer the HTML/JSON from the median-scoring run.
  const medianIdx = runResults.findIndex((r) => r.findings === median);
  const chosen = runResults[medianIdx === -1 ? 0 : medianIdx];

  const slug = slugFor(urlPath);
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.report.html`), chosen.html);
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.report.json`), chosen.json);
  fs.writeFileSync(
    path.join(OUT_DIR, `${slug}.findings.json`),
    JSON.stringify(median, null, 2),
  );

  const failures = [];
  const checks = [
    ["performance", thresholds.performance],
    ["accessibility", thresholds.accessibility],
    ["best-practices", thresholds.bestPractices],
    ["seo", thresholds.seo],
  ];
  for (const [key, min] of checks) {
    const value = median.scores[key];
    if (value == null) {
      failures.push(`${key}: missing score`);
      continue;
    }
    if (value < min) failures.push(`${key}: ${value} < ${min}`);
  }

  return {
    urlPath,
    pageUrl,
    ...median,
    thresholdFailures: failures,
    slug,
    runs,
  };
}

async function main() {
  const skipBuild = hasFlag("--skip-build");
  // Prod/CI: plain /media/ <img>. Opt into local Picture with --with-picture.
  const withPicture = hasFlag("--with-picture");
  const skipSync = !withPicture;
  const skipSeed = hasFlag("--skip-seed");
  const mode = parseMode();
  const runs = parseRuns();
  const urls = parseLighthouseUrls(parseEqualsOrNext("--urls"));
  const thresholds = {
    performance: DEFAULT_MIN_PERFORMANCE,
    accessibility: DEFAULT_MIN_ACCESSIBILITY,
    bestPractices: DEFAULT_MIN_BEST_PRACTICES,
    seo: DEFAULT_MIN_SEO,
  };

  console.log("lighthouse: ensuring Chrome-for-Testing…");
  const chromePath = await ensureChrome();

  if (!skipSync) {
    const sync = syncPictureAssets();
    if (sync.missingSource) {
      console.log(
        "lighthouse: no public/media/ -- build uses plain /media/ <img> fallbacks (same as CI).",
      );
    } else {
      console.log(
        `lighthouse: picture assets ${sync.linked} linked/copied, ${sync.skipped} already present.`,
      );
    }
  } else {
    console.log(
      "lighthouse: prod-shaped media (skip Picture sync; plain /media/ <img>). Use --with-picture for local srcset/avif.",
    );
  }

  if (!skipBuild) {
    console.log("lighthouse: building fixture site…");
    const code = runCommandSync(
      "pnpm",
      ["--filter", "web", "run", "build:fixture"],
      { cwd: REPO_ROOT },
    );
    if (code !== 0) {
      console.error("lighthouse: build failed.");
      process.exit(code);
    }
  } else if (!fs.existsSync(path.join(WEB_DIR, "dist", "index.html"))) {
    console.error(
      "lighthouse: --skip-build needs apps/web/dist/index.html. Run without --skip-build first.",
    );
    process.exit(1);
  }

  let server;
  let modeDescription;
  if (mode === "cf") {
    if (!skipSeed) {
      console.log(
        "lighthouse: seeding local R2 images from public/media (Worker /media/*; skip video/HLS for speed)…",
      );
      const seeded = seedLocalR2({ imagesOnly: true });
      if (!seeded.sourceDir) {
        console.warn(
          "lighthouse: no media tree to seed -- /media/* may 404 under wrangler.",
        );
      } else {
        console.log(
          `lighthouse: R2 seed ${seeded.uploaded} uploaded, ${seeded.skipped} skipped, ${seeded.failed} failed.`,
        );
        if (seeded.failed > 0) {
          console.error("lighthouse: R2 seed had failures; aborting CF mode.");
          process.exit(1);
        }
      }
    }
    console.log("lighthouse: starting wrangler --local (CF-shaped)…");
    server = await startWranglerDev({ startPort: 8787 });
    modeDescription =
      "Cloudflare wrangler --local (Assets + Worker /media/* from R2)";
  } else {
    console.log("lighthouse: starting astro preview (static dist only)…");
    server = await startAstroPreview({ startPort: 4325 });
    modeDescription =
      "astro preview of dist/ (no Worker/R2; faster, less prod-like)";
  }
  console.log(`lighthouse: serving ${server.baseUrl} [${mode}]`);

  const stopServer = () => server.stop();
  process.on("exit", stopServer);
  process.on("SIGINT", () => {
    stopServer();
    process.exit(130);
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const pages = [];
  try {
    for (const urlPath of urls) {
      console.log(`lighthouse: auditing ${urlPath}…`);
      pages.push(
        await auditUrl(chrome, server.baseUrl, urlPath, thresholds, runs),
      );
    }
  } finally {
    await chrome.kill();
    stopServer();
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    mode,
    modeDescription,
    outDir: path.relative(REPO_ROOT, OUT_DIR),
    thresholds,
    simulation: {
      formFactor: "mobile",
      throttling: defaultConfig.settings.throttling,
      throttlingMethod: defaultConfig.settings.throttlingMethod,
      screenEmulation: defaultConfig.settings.screenEmulation,
      note: "Lighthouse Slow 4G simulate (~85th percentile mobile) + CPU 4x",
    },
    pages: pages.map((p) => ({
      urlPath: p.urlPath,
      pageUrl: p.pageUrl,
      scores: p.scores,
      metrics: p.metrics,
      lcpElement: p.lcpElement,
      lcpBreakdown: p.lcpBreakdown,
      clsCulprits: p.clsCulprits,
      opportunities: p.opportunities,
      diagnostics: p.diagnostics,
      failedAudits: p.failedAudits,
      thresholdFailures: p.thresholdFailures,
      runs: p.runs,
    })),
    ok: pages.every((p) => p.thresholdFailures.length === 0),
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  const agentMd = formatAgentMarkdown(summary);
  fs.writeFileSync(path.join(OUT_DIR, "AGENT.md"), agentMd);

  console.log("");
  console.log("Lighthouse mobile (Slow 4G simulate, CPU 4x)");
  console.log("────────────────────────────────────────────");
  let failed = false;
  for (const p of pages) {
    const line = [
      p.urlPath.padEnd(14),
      `perf ${p.scores.performance ?? "?"}`.padEnd(10),
      `a11y ${p.scores.accessibility ?? "?"}`.padEnd(10),
      `bp ${p.scores["best-practices"] ?? "?"}`.padEnd(8),
      `seo ${p.scores.seo ?? "?"}`.padEnd(8),
      `LCP ${p.metrics.lcp.display ?? "?"} (${p.metrics.lcp.rating})`,
      `CLS ${p.metrics.cls.display ?? "?"} (${p.metrics.cls.rating})`,
      `TBT ${p.metrics.tbt.display ?? "?"} (${p.metrics.tbt.rating})`,
    ].join("  ");
    console.log(line);
    if (p.lcpElement) console.log(`    LCP element: ${p.lcpElement}`);
    if (p.clsCulprits.length) {
      console.log(
        `    CLS culprits: ${p.clsCulprits.map((c) => c.node).join("; ")}`,
      );
    }
    for (const o of p.opportunities.slice(0, 3)) {
      const save =
        o.savingsMs != null ? `~${Math.round(o.savingsMs)}ms` : o.displayValue;
      console.log(`    opportunity: ${o.title} (${save})`);
    }
    if (p.thresholdFailures.length) {
      failed = true;
      for (const f of p.thresholdFailures)
        console.error(`  ✗ ${p.urlPath}: ${f}`);
    } else {
      console.log(`  ✓ ${p.urlPath} meets thresholds`);
    }
  }
  console.log(`Agent report: ${path.relative(REPO_ROOT, OUT_DIR)}/AGENT.md`);
  console.log(
    `Shared contract: ${path.relative(REPO_ROOT, OUT_DIR)}/README.md + AGENT.example.md`,
  );
  console.log(
    `Summary JSON: ${path.relative(REPO_ROOT, OUT_DIR)}/summary.json`,
  );
  console.log(
    `Thresholds: perf≥${thresholds.performance} a11y≥${thresholds.accessibility} bp≥${thresholds.bestPractices} seo≥${thresholds.seo}`,
  );

  if (failed) {
    console.error(
      "\nlighthouse: one or more routes missed thresholds (Q1: mobile performance ≥ 90).",
    );
    console.error("Read .lighthouse/AGENT.md for CLS/LCP/opportunity details.");
    process.exit(1);
  }
  console.log("\nlighthouse: OK");
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main().catch((err) => {
    console.error(`lighthouse: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
}
