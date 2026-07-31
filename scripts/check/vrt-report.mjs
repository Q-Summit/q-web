#!/usr/bin/env node
/**
 * vrt-report: the brains of the advisory visual (VRT) job. Adapted from the
 * Noa-IQ marketing-website VRT. From the Playwright JSON report it:
 *
 *   1. figures out which snapshots changed vs the committed baselines (retry
 *      aware: keys off the test's FINAL status, so a flaky-but-passed test is
 *      never reported as a change);
 *   2. in AUTO mode (VRT_WRITE_BASELINES=1) copies each changed snapshot's
 *      *-actual.png over its committed baseline, so the workflow can commit
 *      them (turning the before/after into GitHub's native image diff in the
 *      PR "Files changed" tab, which merging then adopts);
 *   3. writes the sticky PR comment body (vrt-comment.md), an accordion of the
 *      changed snapshots, each deep-linked into the hosted report when
 *      published, else the native image diff; and
 *   4. emits has_changes / wrote to $GITHUB_OUTPUT and prints the body to
 *      stdout (the workflow tees it into the run step summary).
 *
 * It NEVER throws: a missing or garbage report degrades to a note rather than
 * failing the (non-blocking) job. The pure parts (collectChanges, groupChanges,
 * renderComment) are exported for scripts/check/vrt-report.test.mjs.
 *
 * Env (all optional, supplied by Actions): VRT_MODE=auto|compare ,
 * VRT_WRITE_BASELINES=1 , VRT_REPORT_URL (Cloudflare Pages report) ,
 * GITHUB_SERVER_URL , GITHUB_REPOSITORY , GITHUB_RUN_ID , PR_NUMBER ,
 * PR_HEAD_SHA (the reviewed commit, falls back to GITHUB_SHA) , GITHUB_OUTPUT.
 */
import { createHash } from "node:crypto";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
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

/**
 * Walk the Playwright JSON report and bucket each unexpected test:
 *   - changed: a -diff.png attachment means an existing baseline differs;
 *   - added: an -actual.png with no -diff.png means a brand-new snapshot
 *     (missing baseline, or updateSnapshots:'missing'); AUTO commits it;
 *   - otherFailures: no screenshot at all means a genuine render error.
 */
export function collectChanges(report) {
  const changed = new Map();
  const added = new Map();
  const otherFailures = new Set();
  let total = 0;

  const visit = (suites) => {
    if (!Array.isArray(suites)) return;
    for (const suite of suites) {
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
            otherFailures.add(spec?.title ?? "(unnamed spec)");
          }
        }
      }
      visit(suite?.suites);
    }
  };
  visit(report?.suites);

  return { total, changed, added, otherFailures: [...otherFailures].sort() };
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
 * Render the sticky PR comment. One comment per PR, updated in place on every
 * push, including flipping back to the all-clear when a later commit removes
 * the change.
 */
export function renderComment(stats, env = {}) {
  const {
    total,
    changed,
    added = new Map(),
    removed = [],
    otherFailures,
  } = stats;
  const { committed = false, reportUrl = "", baseRef = "main" } = env;
  const names = [...changed.keys()].sort();
  const addedNames = [...added.keys()].sort();
  const removedNames = [...removed]
    .map((n) => (n.endsWith(".png") ? n.slice(0, -4) : n))
    .sort();
  const n = names.length;
  const nAdded = addedNames.length;
  const nRemoved = removedNames.length;
  const repoUrl = `${env.server ?? "https://github.com"}/${env.repo ?? ""}`;
  const filesUrl = env.pr ? `${repoUrl}/pull/${env.pr}/files` : repoUrl;
  const runUrl = env.runId ? `${repoUrl}/actions/runs/${env.runId}` : repoUrl;
  const sha7 = (env.sha ?? "").slice(0, 7);
  const commit = sha7 ? `[\`${sha7}\`](${repoUrl}/commit/${env.sha})` : "";
  const reportBase = reportUrl.replace(/\/+$/, "");
  const out = [MARKER];

  if (env.ok === false) {
    out.push(
      "### Visual review: report unavailable",
      "",
      "The Playwright report could not be read; see the job log.",
    );
    return out.join("\n");
  }

  if (n === 0 && nAdded === 0 && nRemoved === 0 && otherFailures.length === 0) {
    out.push(
      "### Visual review: no changes",
      "",
      `All ${total} snapshot${total === 1 ? "" : "s"} match \`${baseRef}\`.${commit ? `  (${commit})` : ""}`,
    );
    return out.join("\n");
  }

  const widthLink = (w) => {
    const label = w.width || "view";
    const id = (changed.get(w.name) ?? added.get(w.name))?.id;
    if (reportBase && id) return `[${label}](${reportBase}/#?testId=${id})`;
    if (committed) return `[${label}](${filesUrl}#${filesAnchor(w.name)})`;
    return label;
  };
  const accordion = (snapNames, summary, linkWidths = true) => {
    const rows = groupChanges(snapNames).flatMap(({ component, variants }) =>
      variants.map(({ variant, widths }) => ({ component, variant, widths })),
    );
    const lines = [`<details><summary>${summary}</summary>`, ""];
    for (const { component, variant, widths } of rows.slice(0, 50)) {
      const head = variant
        ? `\`${escapeInline(component)}\` : ${escapeInline(variant)}`
        : `\`${escapeInline(component)}\``;
      const widthBits = linkWidths
        ? widths.map(widthLink).join(" , ")
        : widths.map((w) => w.width || "view").join(" , ");
      lines.push(`- **${head}** ${widthBits}`);
    }
    if (rows.length > 50)
      lines.push(
        `- and ${rows.length - 50} more variants, see the full report`,
      );
    lines.push("", "</details>");
    return lines;
  };

  if (n > 0) {
    const compN = groupChanges(names).length;
    out.push(
      `### Visual review: ${compN} component${compN === 1 ? "" : "s"} changed ` +
        `(${n} snapshot${n === 1 ? "" : "s"})`,
      "",
    );
  } else if (nAdded > 0) {
    out.push(
      `### Visual review: ${nAdded} new snapshot${nAdded === 1 ? "" : "s"} added`,
      "",
    );
  } else if (nRemoved > 0) {
    out.push(
      `### Visual review: ${nRemoved} orphan baseline${nRemoved === 1 ? "" : "s"}`,
      "",
    );
  } else {
    out.push("### Visual review: render issues", "");
  }

  // Hero line: the click-to-open hosted report and the commit under review.
  const hero = [];
  if (reportBase) hero.push(`[Open the visual report](${reportBase})`);
  if (commit) hero.push(`commit ${commit}`);
  if (hero.length) out.push(hero.join("  |  "), "");

  if (committed) {
    out.push(
      "Merging this PR adopts these baselines. Review the diffs, then merge if intended.",
      "",
    );
  } else {
    out.push(
      "This check is advisory and never blocks the merge. Review the diffs below.",
      "",
    );
  }

  if (n > 0)
    out.push(...accordion(names, `${n} changed snapshot${n === 1 ? "" : "s"}`));
  if (nAdded > 0)
    out.push(
      ...accordion(
        addedNames,
        `${nAdded} new snapshot${nAdded === 1 ? "" : "s"}`,
      ),
    );
  if (nRemoved > 0)
    out.push(
      ...accordion(
        removedNames,
        committed
          ? `${nRemoved} orphan baseline${nRemoved === 1 ? "" : "s"} deleted`
          : `${nRemoved} orphan baseline${nRemoved === 1 ? "" : "s"} (no gallery entry; AUTO / vrt:update will delete)`,
        false,
      ),
    );
  if (otherFailures.length) {
    out.push(
      "",
      `<details><summary>${otherFailures.length} render issue${otherFailures.length === 1 ? "" : "s"} (not a pixel diff)</summary>`,
      "",
      ...otherFailures.slice(0, 50).map((t) => `- ${t}`),
      "",
      "</details>",
    );
  }
  out.push("", `[Job log](${runUrl})`);
  return out.join("\n");
}

// Serialize the AUTO baseline manifest: one filename per line, with a trailing
// newline on EVERY line (including the last) so a shell `while read` loop can
// never silently drop the final entry. Empty in -> empty file.
export function renderManifest(names) {
  return names.map((n) => `${n}\n`).join("");
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
  const reportPath =
    process.argv.find((a, i) => i >= 2 && !a.startsWith("--")) ||
    "vrt-results.json";
  const write = process.env.VRT_WRITE_BASELINES === "1" || pruneOnly;
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

  // NEVER throw: any failure (unreadable/garbage report, a pathological report
  // that overflows the parser, a render error) degrades to an "unavailable"
  // note so the advisory job never red-Xes on infrastructure. `unavailable`
  // lets the workflow surface it instead of leaving a misleading silent-green.
  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    const stats = collectChanges(report);
    // Orphans = committed PNGs with no gallery page (removed *.vrt.ts variant).
    // Detect always so COMPARE mode surfaces them; delete only in AUTO/write.
    // CI / AUTO always runs after a fresh vrt:build in this job -> trust gallery.
    const orphans = findOrphanBaselines(BASELINE_DIR, GALLERY_DIR, {
      cautious: false,
    });
    stats.removed = orphans;

    // AUTO mode: stage each changed/added actual over its committed baseline so
    // the workflow can commit them. No second Playwright run needed. Also prune
    // orphans so a deleted variant does not leave forever-bloat in the tree.
    let wrote = 0;
    let deleted = [];
    if (write) {
      const wroteNames = [];
      const root = path.resolve(BASELINE_DIR);
      for (const [name, a] of [...stats.changed, ...stats.added]) {
        if (!a.actual || !existsSync(a.actual)) continue;
        const rel = `${name}.png`;
        // Filename contract first (rejects `..`, slashes, odd widths), then
        // path.resolve containment so a tampered report cannot escape the dir.
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
          wrote += 1;
          wroteNames.push(rel);
        } catch (e) {
          console.log(`vrt-report: could not stage ${name} (${e.message})`);
        }
      }
      deleted = pruneOrphanBaselines(BASELINE_DIR, orphans);
      stats.removed = deleted;
      // Manifests of exactly the baselines refreshed / deleted (one filename
      // per line). Always under REPO_ROOT so the AUTO push finds them after
      // `git checkout -f` regardless of the reporter's cwd. The push applies
      // ONLY these onto the PR head, so a baseline the PR intentionally
      // deleted is never resurrected, and removals are git-rm'd.
      writeFileSync(
        rootScratch("vrt-wrote-baselines.txt"),
        renderManifest(wroteNames),
      );
      writeFileSync(
        rootScratch("vrt-deleted-baselines.txt"),
        renderManifest(deleted),
      );
    }

    const changes = hasReportableChanges(stats);
    const body = renderComment(stats, {
      ok: true,
      committed: write && (wrote > 0 || deleted.length > 0),
      reportUrl: process.env.VRT_REPORT_URL || "",
      baseRef: process.env.VRT_BASE_REF || "main",
      server: process.env.GITHUB_SERVER_URL,
      repo: process.env.GITHUB_REPOSITORY,
      runId: process.env.GITHUB_RUN_ID,
      pr: process.env.PR_NUMBER,
      sha: process.env.PR_HEAD_SHA || process.env.GITHUB_SHA,
    });
    writeFileSync(rootScratch("vrt-comment.md"), body);
    setOutput("has_changes", String(changes));
    setOutput("wrote", String(wrote));
    setOutput("deleted", String(deleted.length));
    setOutput("unavailable", "false");
    console.log(body);
  } catch (e) {
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
    writeFileSync(rootScratch("vrt-comment.md"), body);
    setOutput("has_changes", "false");
    setOutput("wrote", "0");
    setOutput("deleted", "0");
    setOutput("unavailable", "true");
    console.log(`vrt-report: could not process ${reportPath} (${e.message})`);
    console.log(body);
    process.exit(0);
  }
}
