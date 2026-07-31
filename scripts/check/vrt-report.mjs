#!/usr/bin/env node
/**
 * vrt-report: classify Playwright VRT results, write the sticky PR comment,
 * enhance the HTML report (buckets + component grouping), and in AUTO mode
 * stage refreshed baselines.
 *
 * Pipeline (see visual.yml):
 *   1. collectChanges - bucket unexpected tests (changed / added / failed)
 *   2. enhancePlaywrightReport - title prefixes, banner, regroup by *.vrt.ts
 *   3. renderComment - sticky body (changed first; compact added)
 *   4. AUTO - copy *-actual.png over baselines + prune orphans
 *
 * Never throws at the CLI: garbage input degrades to "report unavailable".
 * Pure helpers are exported for scripts/check/vrt-report.test.mjs.
 *
 * Env (optional, from Actions): VRT_WRITE_BASELINES, VRT_REPORT_URL,
 * VRT_BASE_REF, VRT_COMMENT_ONLY, VRT_COMMITTED, GITHUB_*, PR_NUMBER,
 * PR_HEAD_SHA, GITHUB_OUTPUT.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths from the repo root so the CLI works whether cwd is the root
// (Actions) or apps/web (`pnpm --filter web run vrt:update`).
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

// Sticky-comment anchor: the comment step finds-or-updates the one comment
// carrying this marker.
export const MARKER = "<!-- vrt-report -->";
// Where committed baselines live (playwright.config.ts snapshotPathTemplate).
// REL form is the GitHub Files-changed path; absolute form is for fs ops.
export const BASELINE_DIR_REL = "apps/web/tests/visual/__screenshots__";
export const BASELINE_DIR = path.join(REPO_ROOT, BASELINE_DIR_REL);
// Built gallery pages (one dir per variant id). Must match gallery.spec.ts
// enumeration and the WIDTHS it screenshots (apps/web/tests/visual/widths.ts).
export const GALLERY_DIR_REL = "apps/web/dist-vrt/vrt";
export const GALLERY_DIR = path.join(REPO_ROOT, GALLERY_DIR_REL);

/** Load WIDTHS from the shared widths.ts (single source with gallery.spec.ts). */
function loadSharedWidths() {
  const file = path.join(REPO_ROOT, "apps/web/tests/visual/widths.ts");
  const src = readFileSync(file, "utf8");
  const m =
    /export const WIDTHS = \[([^\]]+)\]\s+as const/.exec(src) ||
    /export const WIDTHS = \[([^\]]+)\]/.exec(src);
  if (!m) throw new Error(`vrt-report: could not parse WIDTHS from ${file}`);
  const widths = m[1]
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  if (widths.length === 0)
    throw new Error(`vrt-report: empty WIDTHS in ${file}`);
  return widths;
}
export const WIDTHS = loadSharedWidths();

// Snapshot stem: <group>--<variant>-<width>, matching collect.ts SAFE_ID +
// gallery.spec.ts. Rejects path separators / `..` / anything the AUTO push
// must never trust as a relative path under BASELINE_DIR. Widths come from
// the shared WIDTHS list so orphan prune stays aligned with what Playwright
// shoots.
export const SAFE_SNAPSHOT_STEM = new RegExp(
  `^[a-z0-9]+(?:-[a-z0-9]+)*--[a-z0-9]+(?:-[a-z0-9]+)*-(?:${WIDTHS.join("|")})$`,
);

/** Absolute path for a scratch file the workflow reads from the repo root. */
function rootScratch(name) {
  return path.join(REPO_ROOT, name);
}

/** Suite titles that are file paths, not useful describe() labels. */
function isFileSuiteTitle(title) {
  return /\.(?:spec|test)\.(?:[cm]?[jt]s|tsx?)$/i.test(title);
}

/**
 * Human label for a render failure: include describe() ancestors so two
 * components that both have `default @ 1280px` do not collapse into one entry.
 */
export function formatFailureLabel(suitePath, specTitle) {
  const title =
    typeof specTitle === "string" && specTitle.trim()
      ? specTitle.trim()
      : "(unnamed spec)";
  const parts = [...suitePath, title];
  return parts.join(" › ");
}

/**
 * Walk the Playwright JSON report and bucket each unexpected test:
 *   - changed: a -diff.png attachment means an existing baseline differs;
 *   - added: an -actual.png with no -diff.png means a brand-new snapshot
 *     (missing baseline, or updateSnapshots:'missing'); AUTO commits it;
 *   - otherFailures: no screenshot at all means a genuine render error.
 *
 * `failedById` maps Playwright spec/test id -> failure label so the HTML
 * report enhance can tag failures even when titles collide across describes.
 */
export function collectChanges(report) {
  const changed = new Map();
  const added = new Map();
  const otherFailures = new Set();
  const failedById = new Map();
  let total = 0;

  const visit = (suites, suitePath = []) => {
    if (!Array.isArray(suites)) return;
    for (const suite of suites) {
      const rawTitle =
        typeof suite?.title === "string" ? suite.title.trim() : "";
      const nextPath =
        rawTitle && !isFileSuiteTitle(rawTitle)
          ? [...suitePath, rawTitle]
          : suitePath;
      for (const spec of Array.isArray(suite?.specs) ? suite.specs : []) {
        total += 1;
        for (const test of Array.isArray(spec?.tests) ? spec.tests : []) {
          if (test?.status !== "unexpected") continue;
          const shot = {};
          let diffBase = null;
          let actualBase = null;
          let expectedBase = null;
          const results = Array.isArray(test?.results) ? test.results : [];
          for (const result of results) {
            const attachments = Array.isArray(result?.attachments)
              ? result.attachments
              : [];
            for (const a of attachments) {
              const nm = typeof a?.name === "string" ? a.name : "";
              if (nm.endsWith("-diff.png")) {
                shot.diff = a.path;
                diffBase = nm.replace(/-diff\.png$/, "");
              } else if (nm.endsWith("-actual.png")) {
                shot.actual = a.path;
                actualBase = nm.replace(/-actual\.png$/, "");
              } else if (nm.endsWith("-expected.png")) {
                shot.expected = a.path;
                expectedBase = nm.replace(/-expected\.png$/, "");
              }
            }
          }
          const id = typeof spec?.id === "string" ? spec.id : "";
          // Only trust an actual/expected whose base name matches the diff's, so
          // a report that (through a bug or tampering) mixes attachments from
          // different snapshots in one result can never stage the wrong
          // component's pixels over a baseline.
          if (diffBase) {
            changed.set(diffBase, {
              id,
              diff: shot.diff,
              actual: actualBase === diffBase ? shot.actual : undefined,
              expected: expectedBase === diffBase ? shot.expected : undefined,
            });
          } else if (actualBase) {
            // New snapshot: Playwright failed because the baseline PNG is
            // missing. Some versions attach only -actual; others also attach
            // a blank -expected with the same stem. Either way is "added".
            added.set(actualBase, {
              id,
              actual: shot.actual,
              expected: expectedBase === actualBase ? shot.expected : undefined,
            });
          } else {
            const label = formatFailureLabel(nextPath, spec?.title);
            otherFailures.add(label);
            if (id) failedById.set(id, label);
          }
        }
      }
      visit(suite?.suites, nextPath);
    }
  };
  visit(report?.suites);

  return {
    total,
    changed,
    added,
    otherFailures: [...otherFailures].sort(),
    failedById,
  };
}

// True when a relative baseline filename is safe to copy/delete under
// BASELINE_DIR (no directories, no `..`, matches the gallery naming contract).
export function isSafeBaselineRel(rel) {
  if (typeof rel !== "string" || !rel) return false;
  if (rel !== path.basename(rel)) return false;
  if (!rel.endsWith(".png")) return false;
  return SAFE_SNAPSHOT_STEM.test(rel.slice(0, -".png".length));
}

/**
 * Expected baseline filenames from the built gallery (entry dirs x WIDTHS).
 * Returns null when the gallery dir is missing (caller should skip prune
 * rather than wipe every PNG).
 */
export function expectedBaselinesFromGallery(galleryDir = GALLERY_DIR) {
  if (!existsSync(galleryDir)) return null;
  const entries = readdirSync(galleryDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((id) =>
      /^[a-z0-9]+(?:-[a-z0-9]+)*--[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id),
    );
  const expected = new Set();
  for (const id of entries) {
    for (const w of WIDTHS) expected.add(`${id}-${w}.png`);
  }
  return expected;
}

/** Filenames currently in the committed baseline dir (PNG only, flat). */
export function listBaselineNames(baselineDir = BASELINE_DIR) {
  if (!existsSync(baselineDir)) return [];
  return readdirSync(baselineDir).filter(
    (n) => n.endsWith(".png") && !n.includes(path.sep),
  );
}

/**
 * PNGs on disk that no gallery entry produces anymore (removed variant /
 * component), plus any non-conforming filename that should not live here.
 *
 * `cautious` (default true): refuse to report orphans when the gallery looks
 * incomplete relative to the baseline tree (stale/partial dist-vrt). Use
 * `cautious: false` only right after a successful `vrt:build` in the same
 * process (AUTO / `vrt:update --trust-gallery`), where the gallery is fresh.
 */
export function findOrphanBaselines(
  baselineDir = BASELINE_DIR,
  galleryDir = GALLERY_DIR,
  { cautious = true } = {},
) {
  const expected = expectedBaselinesFromGallery(galleryDir);
  if (!expected) return [];
  const current = listBaselineNames(baselineDir);
  // An empty or tiny gallery vs a large baseline tree is almost always a
  // stale/partial dist-vrt, not an intentional mass deletion. Bail out.
  // Threshold: gallery covers less than ~25% of committed PNGs (min 3).
  if (
    cautious &&
    current.length > 0 &&
    expected.size < Math.max(3, Math.floor(current.length * 0.25))
  ) {
    console.log(
      `vrt-report: refusing prune (${expected.size} expected vs ${current.length} on disk; rebuild the gallery first, or pass --trust-gallery after a fresh vrt:build)`,
    );
    return [];
  }
  return current
    .filter((name) => !expected.has(name) || !isSafeBaselineRel(name))
    .sort();
}

/**
 * Delete orphan baseline PNGs. Returns the filenames removed. Refuses any
 * path that fails isSafeBaselineRel (defense in depth even for orphans).
 */
export function pruneOrphanBaselines(
  baselineDir = BASELINE_DIR,
  orphans = findOrphanBaselines(baselineDir),
) {
  const deleted = [];
  for (const name of orphans) {
    if (!isSafeBaselineRel(name)) {
      console.log(`vrt-report: refusing to prune unsafe name "${name}"`);
      continue;
    }
    const dest = path.resolve(baselineDir, name);
    const root = path.resolve(baselineDir);
    if (dest !== root && !dest.startsWith(root + path.sep)) {
      console.log(`vrt-report: refusing to prune path escape "${name}"`);
      continue;
    }
    try {
      if (existsSync(dest)) {
        unlinkSync(dest);
        deleted.push(name);
      }
    } catch (e) {
      console.log(`vrt-report: could not prune ${name} (${e.message})`);
    }
  }
  return deleted;
}

// The advisory job posts a comment / commits baselines only when there is
// something to report. Added and removed snapshots count too.
export function hasReportableChanges(stats) {
  return (
    (stats?.changed?.size ?? 0) > 0 ||
    (stats?.added?.size ?? 0) > 0 ||
    (stats?.removed?.length ?? 0) > 0 ||
    (stats?.otherFailures?.length ?? 0) > 0
  );
}

// GitHub's per-file anchor on the PR "Files changed" page is diff-<sha256(path)>;
// this jumps the reader straight to that snapshot's image diff. A wrong anchor
// still lands on the tab (graceful), so this is best-effort by design.
export function filesAnchor(name) {
  return `diff-${createHash("sha256").update(`${BASELINE_DIR_REL}/${name}.png`).digest("hex")}`;
}

// A snapshot name is <prefix>--<variant>-<width>, e.g.
// home-stats-band--default-1280. Splitting it groups the diff by component and
// variant so ONE change across N widths reads as one line, not N scattered ones.
export function parseSnapshot(name) {
  const m = /^(.*?)-(\d+)$/.exec(name);
  const id = m ? m[1] : name;
  const width = m ? m[2] : "";
  const sep = id.indexOf("--");
  return {
    component: sep === -1 ? id : id.slice(0, sep),
    variant: sep === -1 ? "" : id.slice(sep + 2),
    width,
    name,
  };
}

/**
 * Group changed snapshot names by component then variant, collecting each
 * variant's affected widths. Deterministic (component, variant alphabetical,
 * widths ascending).
 */
export function groupChanges(names) {
  const byComponent = new Map();
  for (const name of names) {
    const { component, variant, width } = parseSnapshot(name);
    if (!byComponent.has(component)) byComponent.set(component, new Map());
    const byVariant = byComponent.get(component);
    if (!byVariant.has(variant)) byVariant.set(variant, []);
    byVariant.get(variant).push({ width, name });
  }
  return [...byComponent.keys()].sort().map((component) => ({
    component,
    variants: [...byComponent.get(component).keys()].sort().map((variant) => ({
      variant,
      widths: byComponent
        .get(component)
        .get(variant)
        .sort((a, b) => (Number(a.width) || 0) - (Number(b.width) || 0)),
    })),
  }));
}

// Neutralize a component/variant string before it goes into the sticky comment:
// drop backticks (which would close an inline code span), angle brackets (HTML
// like `</details>`), pipes (table cells), and newlines (structure/heading
// injection). Defense in depth; the variant/group source is also validated in
// apps/web/src/vrt/collect.ts.
export function escapeInline(s) {
  return String(s)
    .replace(/[`<>|\r\n]/g, " ")
    .trim();
}

/**
 * Bucket counts for the sticky comment + hosted report banner.
 * `same` = specs that are neither a pixel change, a new snapshot, nor a
 * render failure (includes the non-screenshot "gallery has entries" probe).
 */
export function summarizeBuckets(stats) {
  const nChanged = stats?.changed?.size ?? 0;
  const nAdded = stats?.added?.size ?? 0;
  const nFailed = stats?.otherFailures?.length ?? 0;
  const nRemoved = (stats?.removed ?? []).length;
  const total = stats?.total ?? 0;
  const nSame = Math.max(0, total - nChanged - nAdded - nFailed);
  return { total, nChanged, nAdded, nFailed, nRemoved, nSame };
}

/** One-line tally used in the sticky H3 and the hosted report banner. */
export function formatTally({
  nAdded,
  nChanged,
  nSame,
  nFailed,
  nRemoved = 0,
}) {
  const parts = [
    `${nAdded} added`,
    `${nChanged} changed`,
    `${nSame} same`,
    `${nFailed} failed`,
  ];
  // Removed only when present: orphans are not in the Playwright HTML report.
  if (nRemoved > 0) parts.push(`${nRemoved} removed`);
  return parts.join(" · ");
}

/**
 * Default filter for sticky hero + report banner: review priority is
 * changed > failed > added (empty string = show all).
 */
export function preferredReviewBucket({ nChanged, nFailed, nAdded }) {
  if ((nChanged ?? 0) > 0) return "changed";
  if ((nFailed ?? 0) > 0) return "failed";
  if ((nAdded ?? 0) > 0) return "added";
  return "";
}

/** Baselines deleted in the first AUTO pass (one filename per line). */
export function loadDeletedBaselineManifest(
  filePath = rootScratch("vrt-deleted-baselines.txt"),
) {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Hosted-report deep link that pre-fills Playwright search (title prefixes). */
export function reportFilterUrl(reportBase, bucket) {
  const base = String(reportBase || "").replace(/\/+$/, "");
  if (!base) return "";
  if (!bucket) return base;
  return `${base}/#?q=${encodeURIComponent(`[${bucket}]`)}`;
}

/** How many variant rows to expand with per-width links before compacting. */
export const COMMENT_EXPAND_VARIANT_ROWS = 20;
/** Max component lines in a compact "added" accordion. */
export const COMMENT_COMPACT_COMPONENT_ROWS = 60;
/** Max render-failure lines listed in the sticky. */
export const COMMENT_FAIL_ROWS = 40;

/** Playwright HTML file stats block for a regrouped component group. */
export function htmlFileStats(tests) {
  const list = Array.isArray(tests) ? tests : [];
  return {
    total: list.length,
    expected: list.filter((t) => t.outcome === "expected").length,
    unexpected: list.filter((t) => t.outcome === "unexpected").length,
    flaky: list.filter((t) => t.outcome === "flaky").length,
    skipped: list.filter((t) => t.outcome === "skipped").length,
    ok: list.every((t) => t.ok !== false),
  };
}

/**
 * Render the sticky PR comment. One comment per PR, updated in place on every
 * push, including flipping back to the all-clear when a later commit removes
 * the change.
 *
 * Review UX: changed (pixel diffs) first, then failed, then a compact added
 * list (component summary when large), then removed. No meta lectures about
 * Playwright's internal Failed chip.
 */
export function renderComment(stats, env = {}) {
  const {
    total,
    changed,
    added = new Map(),
    removed = [],
    otherFailures = [],
    failedById = new Map(),
  } = stats;
  const { committed = false, reportUrl = "", baseRef = "main" } = env;
  const names = [...changed.keys()].sort();
  const addedNames = [...added.keys()].sort();
  const removedNames = [...removed]
    .map((n) => (n.endsWith(".png") ? n.slice(0, -4) : n))
    .sort();
  const {
    nChanged: n,
    nAdded,
    nFailed,
    nRemoved,
    nSame,
  } = summarizeBuckets(stats);
  const failIdByLabel = new Map();
  for (const [id, label] of failedById instanceof Map
    ? failedById
    : Object.entries(failedById ?? {})) {
    if (id && label) failIdByLabel.set(label, id);
  }
  const repoUrl = `${env.server ?? "https://github.com"}/${env.repo ?? ""}`;
  const filesUrl = env.pr ? `${repoUrl}/pull/${env.pr}/files` : repoUrl;
  const runUrl = env.runId ? `${repoUrl}/actions/runs/${env.runId}` : repoUrl;
  const sha7 = (env.sha ?? "").slice(0, 7);
  const commit = sha7 ? `[\`${sha7}\`](${repoUrl}/commit/${env.sha})` : "";
  const reportBase = String(reportUrl || "").replace(/\/+$/, "");
  const out = [MARKER];

  if (env.ok === false) {
    out.push(
      "### Visual review: report unavailable",
      "",
      "The Playwright report could not be read; see the job log.",
    );
    return out.join("\n");
  }

  if (n === 0 && nAdded === 0 && nRemoved === 0 && nFailed === 0) {
    out.push(
      "### Visual review: no changes",
      "",
      `All ${total} snapshot${total === 1 ? "" : "s"} match \`${baseRef}\`.${commit ? ` (${commit})` : ""}`,
    );
    return out.join("\n");
  }

  const widthLink = (w, source) => {
    const label = w.width || "view";
    const id = source.get(w.name)?.id;
    if (reportBase && id) return `[${label}](${reportBase}/#?testId=${id})`;
    if (committed) return `[${label}](${filesUrl}#${filesAnchor(w.name)})`;
    return label;
  };

  const variantRows = (snapNames) =>
    groupChanges(snapNames).flatMap(({ component, variants }) =>
      variants.map(({ variant, widths }) => ({ component, variant, widths })),
    );

  /** Full per-width accordion (for changed / small lists). */
  const accordionDetailed = (
    snapNames,
    summary,
    source,
    { linkWidths = true, browseBucket = "changed" } = {},
  ) => {
    const rows = variantRows(snapNames);
    const lines = [`<details><summary>${summary}</summary>`, ""];
    for (const { component, variant, widths } of rows.slice(
      0,
      COMMENT_EXPAND_VARIANT_ROWS,
    )) {
      const head = variant
        ? `\`${escapeInline(component)}\` · ${escapeInline(variant)}`
        : `\`${escapeInline(component)}\``;
      const widthBits = linkWidths
        ? widths.map((w) => widthLink(w, source)).join(", ")
        : widths.map((w) => w.width || "view").join(", ");
      lines.push(`- **${head}** ${widthBits}`);
    }
    if (rows.length > COMMENT_EXPAND_VARIANT_ROWS) {
      const more = rows.length - COMMENT_EXPAND_VARIANT_ROWS;
      const browse = reportFilterUrl(reportBase, browseBucket);
      lines.push(
        browse
          ? `- …and ${more} more · [open in report](${browse})`
          : `- …and ${more} more`,
      );
    }
    lines.push("", "</details>");
    return lines;
  };

  /**
   * Compact accordion for large "added" sets: one line per component, no
   * width spam. Reviewers browse shots in the hosted report.
   */
  const accordionCompactComponents = (snapNames, summary, bucket) => {
    const groups = groupChanges(snapNames);
    const browse = reportFilterUrl(reportBase, bucket);
    const lines = [`<details><summary>${summary}</summary>`, ""];
    if (browse) {
      lines.push(`[Browse in the report](${browse})`, "");
    }
    for (const { component, variants } of groups.slice(
      0,
      COMMENT_COMPACT_COMPONENT_ROWS,
    )) {
      const nVar = variants.length;
      const nShot = variants.reduce((acc, v) => acc + v.widths.length, 0);
      lines.push(
        `- \`${escapeInline(component)}\` · ${nVar} variant${nVar === 1 ? "" : "s"} (${nShot} shot${nShot === 1 ? "" : "s"})`,
      );
    }
    if (groups.length > COMMENT_COMPACT_COMPONENT_ROWS) {
      lines.push(
        `- …and ${groups.length - COMMENT_COMPACT_COMPONENT_ROWS} more components`,
      );
    }
    lines.push("", "</details>");
    return lines;
  };

  // Headline: clear tally. Reviewers should not need a second glossary line.
  out.push(
    `### Visual review vs \`${baseRef}\``,
    "",
    formatTally({ nAdded, nChanged: n, nSame, nFailed, nRemoved }),
    "",
  );

  const hero = [];
  if (reportBase) {
    const defaultBucket = preferredReviewBucket({
      nChanged: n,
      nFailed,
      nAdded,
    });
    hero.push(
      `[Open report](${reportFilterUrl(reportBase, defaultBucket) || reportBase})`,
    );
  }
  if (commit) hero.push(commit);
  if (hero.length) out.push(hero.join(" · "), "");

  if (n > 0 && nAdded > 0) {
    out.push(
      `Review **changed** pixel diffs first. **Added** means new vs \`${baseRef}\` (no baseline there yet).`,
      "",
    );
  } else if (n > 0) {
    out.push("Review the pixel diffs below.", "");
  } else if (nAdded > 0) {
    out.push(
      `**Added** snapshots are new vs \`${baseRef}\`. Open the report to preview them.`,
      "",
    );
  }

  if (committed) {
    out.push("Baselines are staged on this PR. Merging adopts them.", "");
  } else {
    out.push("Advisory only: does not block merge.", "");
  }

  // Changed first: that is what humans must approve as intentional.
  if (n > 0) {
    out.push(
      ...accordionDetailed(names, `${n} changed`, changed, {
        browseBucket: "changed",
      }),
    );
  }
  if (nFailed > 0) {
    const failLines = otherFailures.slice(0, COMMENT_FAIL_ROWS).map((t) => {
      const label = escapeInline(t);
      const id = failIdByLabel.get(t);
      if (reportBase && id) {
        return `- [${label}](${reportBase}/#?testId=${id})`;
      }
      return `- ${label}`;
    });
    if (otherFailures.length > COMMENT_FAIL_ROWS) {
      failLines.push(`- …and ${otherFailures.length - COMMENT_FAIL_ROWS} more`);
    }
    out.push(
      `<details><summary>${nFailed} failed (render error)</summary>`,
      "",
      ...failLines,
      "",
      "</details>",
      "",
    );
  }
  if (nAdded > 0) {
    const addedRows = variantRows(addedNames);
    const useCompact = addedRows.length > COMMENT_EXPAND_VARIANT_ROWS;
    const addedSummary = `${nAdded} added`;
    if (useCompact) {
      out.push(
        ...accordionCompactComponents(addedNames, addedSummary, "added"),
      );
    } else {
      out.push(
        ...accordionDetailed(addedNames, addedSummary, added, {
          browseBucket: "added",
        }),
      );
    }
  }
  if (nRemoved > 0) {
    out.push(
      ...accordionDetailed(
        removedNames,
        committed
          ? `${nRemoved} removed`
          : `${nRemoved} orphan${nRemoved === 1 ? "" : "s"} (will delete on AUTO)`,
        new Map(),
        { linkWidths: false, browseBucket: "" },
      ),
    );
  }
  out.push("", `[Job log](${runUrl})`);
  return out.join("\n");
}

const VRT_TITLE_PREFIX = /^\s*\[(?:added|changed|failed|same)\]\s*/i;
const GALLERY_SPEC_FILE = /(^|[/\\])gallery\.spec\.[cm]?[jt]s$/i;

/**
 * Map Playwright HTML-report testIds -> vrt bucket from collectChanges stats.
 * Spec `id` in the JSON reporter matches HTML `testId`.
 */
export function classifyByTestId(stats) {
  const byId = new Map();
  for (const [, a] of stats?.added ?? []) {
    if (a?.id) byId.set(a.id, "added");
  }
  for (const [, a] of stats?.changed ?? []) {
    if (a?.id) byId.set(a.id, "changed");
  }
  const failedById = stats?.failedById;
  if (failedById instanceof Map) {
    for (const id of failedById.keys()) byId.set(id, "failed");
  }
  return byId;
}

function stripVrtTitlePrefix(title) {
  return String(title || "").replace(VRT_TITLE_PREFIX, "");
}

function labelTitle(title, bucket) {
  return `[${bucket}] ${stripVrtTitlePrefix(title)}`;
}

function labelTestEntry(test, bucket) {
  test.title = labelTitle(test.title, bucket);
  // Title prefix drives search filters; skip Playwright tags so the UI does
  // not show both `[changed]` in the title and a duplicate blue chip.
  const annotations = Array.isArray(test.annotations) ? test.annotations : [];
  if (
    !annotations.some((a) => a?.type === "vrt" && a?.description === bucket)
  ) {
    annotations.push({ type: "vrt", description: bucket });
  }
  test.annotations = annotations;
}

/** Bucket for one HTML-report test entry (title prefix / filter chip). */
export function classifyHtmlTestBucket(test, byId, failLabels) {
  if (!test || typeof test !== "object") return null;
  let bucket = byId.get(test.testId);
  if (!bucket && Array.isArray(test.path) && test.path.length) {
    const bare = stripVrtTitlePrefix(test.title);
    const label = formatFailureLabel(test.path, bare);
    if (failLabels.has(label)) bucket = "failed";
  }
  // Flaky-but-passed counts as same in summarizeBuckets (not unexpected).
  if (!bucket && (test.outcome === "expected" || test.outcome === "flaky")) {
    bucket = "same";
  }
  if (!bucket && test.ok === false) {
    const names = (test.results || [])
      .flatMap((r) => r.attachments || [])
      .map((a) => a.name || "");
    if (names.some((n) => n.endsWith("-diff.png"))) bucket = "changed";
    else if (names.some((n) => n.endsWith("-actual.png"))) bucket = "added";
    else bucket = "failed";
  }
  return bucket || null;
}

/**
 * Mirror of apps/web/src/vrt/collect.ts slugFromPath:
 * `…/components/home/StatsBand.vrt.ts` -> `home-stats-band`.
 */
export function vrtSlugFromPath(filePath) {
  return String(filePath)
    .replace(/^.*[/\\]components[/\\]/, "")
    .replace(/\.vrt\.ts$/i, "")
    .replace(/[/\\]/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Map component slug -> repo-relative `*.vrt.ts` path for report source links.
 * First writer wins on slug collisions (keeps the tree deterministic).
 */
export function mapVrtComponentFiles(
  componentsRoot = path.join(REPO_ROOT, "apps/web/src/components"),
) {
  const out = new Map();
  if (!existsSync(componentsRoot)) return out;
  const stack = [componentsRoot];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!ent.isFile() || !ent.name.endsWith(".vrt.ts")) continue;
      const rel = path.relative(REPO_ROOT, full).split(path.sep).join("/");
      const slug = vrtSlugFromPath(rel);
      if (!slug || out.has(slug)) continue;
      out.set(slug, rel);
    }
  }
  return out;
}

/** Short label for report accordion + source link (drop apps/web/src/). */
export function displayVrtSource(component, vrtFiles = new Map()) {
  if (component === "gallery") return "tests/visual/gallery.spec.ts";
  const rel = vrtFiles.get(component);
  if (rel) return rel.replace(/^apps\/web\/src\//, "");
  return `${component}.vrt.ts`;
}

function componentFileId(component) {
  return createHash("sha256")
    .update(`vrt-component:${component}`)
    .digest("hex")
    .slice(0, 20);
}

/**
 * Playwright's HTML report groups by test FILE. Our suite is one
 * `gallery.spec.ts` with `test.describe(component)`, so reviewers only see a
 * single "gallery.spec.ts" shell. Split that into one virtual file per
 * component (from `test.path[0]`) and rewrite each test's `location.file`
 * from `gallery.spec.ts` to the co-located `*.vrt.ts`. Keeps `testId`s
 * stable so sticky deep links still work.
 */
export function regroupReportFilesByComponent(
  files,
  vrtFiles = mapVrtComponentFiles(),
) {
  if (!Array.isArray(files) || files.length === 0) return [];
  const out = [];
  for (const file of files) {
    const tests = Array.isArray(file?.tests) ? file.tests : [];
    const isGalleryShell =
      typeof file?.fileName === "string" &&
      GALLERY_SPEC_FILE.test(file.fileName);
    if (!isGalleryShell || tests.length === 0) {
      out.push(file);
      continue;
    }
    const byComponent = new Map();
    for (const test of tests) {
      const suitePath = Array.isArray(test?.path) ? test.path : [];
      const component = suitePath.length > 0 ? String(suitePath[0]) : "gallery";
      if (!byComponent.has(component)) byComponent.set(component, []);
      const sourceFile = displayVrtSource(component, vrtFiles);
      // Drop the component describe from path (it is now the file name) and
      // rewrite location so rows do not all claim gallery.spec.ts:56.
      byComponent.get(component).push({
        ...test,
        path: suitePath.slice(1),
        location: {
          ...(test.location && typeof test.location === "object"
            ? test.location
            : {}),
          file: sourceFile,
          line: 1,
          column: 1,
        },
      });
    }
    for (const component of [...byComponent.keys()].sort()) {
      const groupTests = byComponent.get(component);
      const displayName = displayVrtSource(component, vrtFiles);
      out.push({
        fileId: componentFileId(component),
        fileName: displayName,
        tests: groupTests,
        stats: htmlFileStats(groupTests),
      });
    }
  }
  return out;
}

/** Inject or replace the sticky VRT banner in index.html. */
export function injectReportBanner(html, banner) {
  const trimmed = banner.trim();
  if (html.includes('id="vrt-summary"')) {
    return html.replace(/<div id="vrt-summary"[\s\S]*?<\/script>/, trimmed);
  }
  return html.replace("<body>", `<body>\n${trimmed}\n`);
}

const ZIP_REPACK_PY =
  "import os,sys,zipfile\n" +
  "root, out = sys.argv[1], sys.argv[2]\n" +
  "if not root.endswith(('/', '\\\\')): root += os.sep\n" +
  "with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:\n" +
  "  for dirpath,_,files in os.walk(root):\n" +
  "    for name in sorted(files):\n" +
  "      full=os.path.join(dirpath,name)\n" +
  "      z.write(full, full[len(root):].replace('\\\\','/'))\n";

/**
 * Rewrite the Playwright HTML report so Added / Changed / Same / Failed are
 * visible: title prefixes plus a sticky banner with filter chips.
 * Playwright's own Passed/Failed chips are hidden (they count missing
 * baselines as Failed); the banner is the source of truth for VRT buckets.
 *
 * Returns true when the report was rewritten.
 */
export function enhancePlaywrightReport(
  reportDir,
  stats,
  { baseRef = "main" } = {},
) {
  const indexPath = path.join(reportDir, "index.html");
  if (!existsSync(indexPath)) return false;

  let html = readFileSync(indexPath, "utf8");
  const m = html.match(
    /<template id="playwrightReportBase64">data:application\/zip;base64,([^<]+)<\/template>/,
  );
  if (!m) {
    console.log("vrt-report: no playwrightReportBase64 template; skip enhance");
    return false;
  }

  const tmp = mkdtempSync(path.join(tmpdir(), "vrt-html-"));
  try {
    const zipPath = path.join(tmp, "report.zip");
    const extractDir = path.join(tmp, "out");
    writeFileSync(zipPath, Buffer.from(m[1], "base64"));
    // Playwright's noble image ships python3 but not zip/unzip. The helper
    // rejects Zip Slip members before writing.
    execFileSync(
      "python3",
      [path.join(REPO_ROOT, "scripts/check/vrt-unzip.py"), zipPath, extractDir],
      { stdio: "pipe" },
    );

    const reportJsonPath = path.join(extractDir, "report.json");
    if (!existsSync(reportJsonPath)) {
      console.log(
        "vrt-report: report.json missing inside HTML zip; skip enhance",
      );
      return false;
    }
    const reportJson = JSON.parse(readFileSync(reportJsonPath, "utf8"));
    const byId = classifyByTestId(stats);
    const failLabels = new Set(stats?.otherFailures ?? []);
    const buckets = summarizeBuckets(stats);

    for (const file of reportJson.files || []) {
      if (!Array.isArray(file?.tests)) continue;
      for (const test of file.tests) {
        const bucket = classifyHtmlTestBucket(test, byId, failLabels);
        if (bucket) labelTestEntry(test, bucket);
      }
    }
    // One file per component (not one giant gallery.spec.ts). testIds stay so
    // sticky deep links keep working.
    reportJson.files = regroupReportFilesByComponent(reportJson.files || []);
    for (const name of readdirSync(extractDir)) {
      if (name !== "report.json" && name.endsWith(".json")) {
        unlinkSync(path.join(extractDir, name));
      }
    }
    for (const file of reportJson.files) {
      writeFileSync(
        path.join(extractDir, `${file.fileId}.json`),
        JSON.stringify({
          fileId: file.fileId,
          fileName: file.fileName,
          tests: file.tests,
        }),
      );
    }
    reportJson.metadata = {
      ...(reportJson.metadata || {}),
      vrt: { baseRef, ...buckets },
    };
    writeFileSync(reportJsonPath, JSON.stringify(reportJson));

    const outZip = path.join(tmp, "report-out.zip");
    execFileSync("python3", ["-c", ZIP_REPACK_PY, extractDir, outZip], {
      stdio: "pipe",
    });
    const b64 = readFileSync(outZip).toString("base64");
    html = html.replace(
      /<template id="playwrightReportBase64">data:application\/zip;base64,[^<]+<\/template>/,
      `<template id="playwrightReportBase64">data:application/zip;base64,${b64}</template>`,
    );

    const tally = formatTally(buckets);
    html = injectReportBanner(
      html,
      buildReportBanner({ baseRef, tally, ...buckets }),
    );
    writeFileSync(indexPath, html);
    console.log(
      `vrt-report: enhanced HTML report (${tally}; ${reportJson.files.length} component groups)`,
    );
    return true;
  } catch (e) {
    console.log(`vrt-report: could not enhance HTML report (${e.message})`);
    return false;
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
}

/** Sticky banner + filter chips injected above Playwright's #root. */
export function buildReportBanner({
  baseRef,
  tally,
  nAdded,
  nChanged,
  nSame,
  nFailed,
}) {
  // Inline CSS/JS only: the report is a static Pages deploy with no bundler.
  // Filters fill Playwright's search box with the title prefix we stamped on
  // each test (`[added]`, …). Playwright's own Passed/Failed chips are hidden:
  // they count missing baselines as Failed and fight the VRT tally.
  const bucket = preferredReviewBucket({ nChanged, nFailed, nAdded });
  const defaultFilter = bucket ? `[${bucket}]` : "";
  const safeDefault = JSON.stringify(defaultFilter);
  return `<div id="vrt-summary" role="region" aria-label="Visual review summary" style="position:sticky;top:0;z-index:9999;background:#141418;color:#f0f0f0;border-bottom:1px solid #333;font:14px/1.45 ui-sans-serif,system-ui,sans-serif;padding:12px 16px;">
  <style>
    /* Playwright encodes status chip hrefs as q=s%3A… (percent-encoded colon). */
    nav a[href*="q=s%3A"],
    nav a[href*="q=s:"] { display: none !important; }
    #vrt-filters button[aria-pressed="true"] { outline: 2px solid #9cf; outline-offset: 1px; }
  </style>
  <div style="display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;">
    <div>
      <div style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;opacity:.7;margin-bottom:2px;">Visual review vs ${escapeInline(baseRef)}</div>
      <div style="font-size:16px;font-weight:600;">${escapeInline(tally)}</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;" id="vrt-filters" role="group" aria-label="Filter by VRT bucket">
      <button type="button" data-vrt-filter="[added]" aria-pressed="false" style="cursor:pointer;border:1px solid #3d7a5c;background:#1a3328;color:#d4f0e0;border-radius:6px;padding:5px 11px;">Added ${nAdded}</button>
      <button type="button" data-vrt-filter="[changed]" aria-pressed="false" style="cursor:pointer;border:1px solid #8a6a3d;background:#332818;color:#f5e6c8;border-radius:6px;padding:5px 11px;">Changed ${nChanged}</button>
      <button type="button" data-vrt-filter="[same]" aria-pressed="false" style="cursor:pointer;border:1px solid #555;background:#222226;color:#ccc;border-radius:6px;padding:5px 11px;">Same ${nSame}</button>
      <button type="button" data-vrt-filter="[failed]" aria-pressed="false" style="cursor:pointer;border:1px solid #8a3d3d;background:#331818;color:#f0d0d0;border-radius:6px;padding:5px 11px;">Failed ${nFailed}</button>
      <button type="button" data-vrt-filter="" aria-pressed="false" style="cursor:pointer;border:1px solid #666;background:transparent;color:#ddd;border-radius:6px;padding:5px 11px;">All</button>
    </div>
  </div>
</div>
<script>
(function () {
  var DEFAULT = ${safeDefault};
  var appliedDefault = false;
  var statusHref = new RegExp("q=s(%" + "3A|:)(passed|failed|flaky|skipped)", "i");
  function findSearch() {
    return document.querySelector('input[placeholder*="Search"], input[type="search"], [class*="search"] input');
  }
  function hidePlaywrightChips() {
    // Chip text is often "Failed387" (no space); hrefs use a percent-encoded colon.
    var all = document.querySelectorAll("a");
    for (var j = 0; j < all.length; j++) {
      var a = all[j];
      var href = a.getAttribute("href") || "";
      var t = (a.textContent || "").replace(/\\s+/g, " ").trim();
      var byHref = statusHref.test(href);
      var byText = /^(Passed|Failed|Flaky|Skipped)\\s*\\d+$/i.test(t);
      if (!(byHref || byText)) continue;
      if (a.closest("nav") || byText) a.style.setProperty("display", "none", "important");
    }
  }
  function setPressed(q) {
    var buttons = document.querySelectorAll("#vrt-filters [data-vrt-filter]");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      var v = b.getAttribute("data-vrt-filter") || "";
      b.setAttribute("aria-pressed", v === q ? "true" : "false");
    }
  }
  function apply(q) {
    var input = findSearch();
    if (!input) return false;
    var proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    if (proto && proto.set) proto.set.call(input, q);
    else input.value = q;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    setPressed(q);
    return true;
  }
  function boot() {
    hidePlaywrightChips();
    if (DEFAULT && !appliedDefault && apply(DEFAULT)) appliedDefault = true;
  }
  document.getElementById("vrt-filters")?.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-vrt-filter]");
    if (!btn) return;
    appliedDefault = true;
    apply(btn.getAttribute("data-vrt-filter") || "");
  });
  boot();
  // Keep hiding chips while Playwright hydrates nav (search can appear before chips).
  var tries = 0;
  var timer = setInterval(function () {
    tries += 1;
    boot();
    if (tries >= 40) clearInterval(timer);
  }, 100);
  if (typeof MutationObserver !== "undefined") {
    var mo = new MutationObserver(function () { hidePlaywrightChips(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 5000);
  }
})();
</script>`;
}

// Serialize the AUTO baseline manifest: one filename per line, with a trailing
// newline on EVERY line (including the last) so a shell `while read` loop can
// never silently drop the final entry. Empty in -> empty file.
export function renderManifest(names) {
  return names.map((n) => `${n}\n`).join("");
}

/**
 * Copy changed/added *-actual.png files over committed baselines.
 * Returns { wrote, wroteNames }. Refuses unsafe / escaping paths.
 */
export function stageBaselineActuals(stats, baselineDir = BASELINE_DIR) {
  const wroteNames = [];
  const root = path.resolve(baselineDir);
  for (const [name, a] of [
    ...(stats?.changed ?? []),
    ...(stats?.added ?? []),
  ]) {
    if (!a?.actual || !existsSync(a.actual)) continue;
    const rel = `${name}.png`;
    if (!isSafeBaselineRel(rel)) {
      console.log(`vrt-report: refusing unsafe baseline name "${name}"`);
      continue;
    }
    const dest = path.resolve(root, rel);
    if (dest !== root && !dest.startsWith(root + path.sep)) {
      console.log(`vrt-report: refusing path escape "${name}"`);
      continue;
    }
    try {
      copyFileSync(a.actual, dest);
      wroteNames.push(rel);
    } catch (e) {
      console.log(`vrt-report: could not stage ${name} (${e.message})`);
    }
  }
  return { wrote: wroteNames.length, wroteNames };
}

// --- CLI entry (skipped when imported by the test) -------------------------
const invokedDirectly =
  process.argv[1] && process.argv[1].endsWith("vrt-report.mjs");
if (invokedDirectly) {
  const pruneOnly = process.argv.includes("--prune-only");
  // After a fresh vrt:build in the same command (vrt:update / CI AUTO), the
  // gallery is complete: allow large intentional deletions. Standalone
  // `--prune-only` stays cautious so a stale dist-vrt cannot wipe the corpus.
  const trustGallery = process.argv.includes("--trust-gallery");
  // Post-deploy pass: rewrite the sticky comment with the live Pages URL only
  // (no re-staging, no second HTML rewrite). Set by visual.yml after deploy.
  const commentOnly =
    process.argv.includes("--comment-only") ||
    process.env.VRT_COMMENT_ONLY === "1";
  const reportPath =
    process.argv.find((a, i) => i >= 2 && !a.startsWith("--")) ||
    "vrt-results.json";
  const write =
    !commentOnly && (process.env.VRT_WRITE_BASELINES === "1" || pruneOnly);
  const setOutput = (k, v) => {
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
  };

  // Local / workflow_dispatch path: drop PNGs whose gallery entry is gone
  // (Playwright --update-snapshots never deletes). Exits 0 always.
  if (pruneOnly) {
    const orphans = findOrphanBaselines(BASELINE_DIR, GALLERY_DIR, {
      cautious: !trustGallery,
    });
    const deleted = pruneOrphanBaselines(BASELINE_DIR, orphans);
    writeFileSync(
      rootScratch("vrt-deleted-baselines.txt"),
      renderManifest(deleted),
    );
    console.log(
      deleted.length
        ? `vrt-report: pruned ${deleted.length} orphan baseline(s)`
        : "vrt-report: no orphan baselines",
    );
    process.exit(0);
  }

  // NEVER throw: any failure degrades to "unavailable" so the advisory job
  // never red-Xes on infrastructure. --comment-only never clobbers a good
  // sticky from the first pass.
  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    const stats = collectChanges(report);
    // Orphans = committed PNGs with no gallery page. Detect always; delete
    // only in AUTO/write. --comment-only runs AFTER prune: prefer the
    // first-pass delete manifest so the sticky keeps the removed accordion.
    const orphans = findOrphanBaselines(BASELINE_DIR, GALLERY_DIR, {
      cautious: false,
    });
    stats.removed = commentOnly
      ? (loadDeletedBaselineManifest() ?? orphans)
      : orphans;

    let wrote = 0;
    let deleted = [];
    if (write) {
      const staged = stageBaselineActuals(stats);
      wrote = staged.wrote;
      deleted = pruneOrphanBaselines(BASELINE_DIR, orphans);
      stats.removed = deleted;
      // Manifests under REPO_ROOT so AUTO push finds them after git checkout -f.
      writeFileSync(
        rootScratch("vrt-wrote-baselines.txt"),
        renderManifest(staged.wroteNames),
      );
      writeFileSync(
        rootScratch("vrt-deleted-baselines.txt"),
        renderManifest(deleted),
      );
    }

    const changes = hasReportableChanges(stats);
    const baseRef = process.env.VRT_BASE_REF || "main";
    const committed = commentOnly
      ? process.env.VRT_COMMITTED === "true"
      : write && (wrote > 0 || deleted.length > 0);
    // Enhance BEFORE Pages deploy. Skip on --comment-only (already done).
    if (!commentOnly) {
      enhancePlaywrightReport(
        path.join(REPO_ROOT, "apps/web/playwright-report"),
        stats,
        { baseRef },
      );
    }
    const body = renderComment(stats, {
      ok: true,
      committed,
      reportUrl: process.env.VRT_REPORT_URL || "",
      baseRef,
      server: process.env.GITHUB_SERVER_URL,
      repo: process.env.GITHUB_REPOSITORY,
      runId: process.env.GITHUB_RUN_ID,
      pr: process.env.PR_NUMBER,
      sha: process.env.PR_HEAD_SHA || process.env.GITHUB_SHA,
    });
    writeFileSync(rootScratch("vrt-comment.md"), body);
    if (!commentOnly) {
      setOutput("has_changes", String(changes));
      setOutput("wrote", String(wrote));
      setOutput("deleted", String(deleted.length));
      setOutput("committed", String(committed));
      setOutput("unavailable", "false");
    }
    console.log(body);
  } catch (e) {
    const commentPath = rootScratch("vrt-comment.md");
    if (commentOnly && existsSync(commentPath)) {
      console.log(
        `vrt-report: comment-only failed (${e.message}); keeping prior comment`,
      );
      process.exit(0);
    }
    const body = renderComment(
      {
        total: 0,
        changed: new Map(),
        added: new Map(),
        removed: [],
        otherFailures: [],
      },
      { ok: false },
    );
    writeFileSync(commentPath, body);
    setOutput("has_changes", "false");
    setOutput("wrote", "0");
    setOutput("deleted", "0");
    setOutput("unavailable", "true");
    console.log(`vrt-report: could not process ${reportPath} (${e.message})`);
    console.log(body);
    process.exit(0);
  }
}
