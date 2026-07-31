#!/usr/bin/env node
/**
 * vrt-cleanup: delete throwaway Cloudflare Pages visual-report deployments for
 * CLOSED PRs. Adapted from the Noa-IQ marketing-website VRT.
 *
 * The visual job (.github/workflows/visual.yml) publishes the Playwright diff
 * report to the `q-web-vrt-reports` Pages project under a per-PR branch alias
 * (`pr-<N>`), redeploying on every push. Those previews are only useful while
 * the PR is open. `.github/workflows/visual-cleanup.yml` runs this on
 * `pull_request: closed`.
 *
 * It SWEEPS rather than cleaning a single PR: it scans the `pr-<N>` preview
 * deployments (bounded, best-effort) and deletes those whose PR is no longer
 * open, so cleanup is self-healing if a `closed` event is ever missed. The
 * triggering PR (PR_NUMBER) is always cleaned.
 *
 * Best-effort hygiene: no-ops (exit 0) without the Cloudflare secrets; never
 * hard-fails on an API hiccup; only ever deletes a deployment whose PR it has
 * CONFIRMED is not open (open or unknown => kept).
 *
 * Env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CF_PAGES_PROJECT (default
 * q-web-vrt-reports), GITHUB_TOKEN + GITHUB_REPOSITORY (to read PR state; without
 * them only PR_NUMBER is swept), PR_NUMBER (always cleaned).
 */
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const project = process.env.CF_PAGES_PROJECT || "q-web-vrt-reports";
const triggeringPr = process.env.PR_NUMBER || "";
const ghToken = process.env.GITHUB_TOKEN || "";
const repo = process.env.GITHUB_REPOSITORY || "";

if (!token || !account) {
  console.log("vrt-cleanup: no Cloudflare secrets; nothing to clean.");
  process.exit(0);
}

const base = `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${project}/deployments`;
const cfHeaders = { Authorization: `Bearer ${token}` };

// Map every `pr-<N>` branch alias to its deployment ids (paginated, bounded).
async function deploymentsByPr() {
  const byPr = new Map();
  for (let page = 1; page <= 80; page++) {
    let res;
    try {
      res = await fetch(`${base}?env=preview&per_page=25&page=${page}`, {
        headers: cfHeaders,
      });
    } catch (e) {
      console.log(`vrt-cleanup: list page ${page} failed: ${e.message}`);
      break;
    }
    if (!res.ok) {
      console.log(
        `vrt-cleanup: list page ${page} -> HTTP ${res.status}; stopping.`,
      );
      break;
    }
    const json = await res.json().catch(() => null);
    const items = json?.result;
    if (!Array.isArray(items) || items.length === 0) break;
    for (const d of items) {
      const branch = d?.deployment_trigger?.metadata?.branch || "";
      const m = /^pr-(\d+)$/.exec(branch);
      if (!m) continue;
      if (!byPr.has(m[1])) byPr.set(m[1], []);
      byPr.get(m[1]).push(d.id);
    }
    if (items.length < 25) break;
    if (page === 80) {
      // Hit the scan cap with a still-full page: more deployments exist beyond
      // it, so this sweep is incomplete. Surface it rather than silently
      // pretending everything was covered.
      console.log(
        "vrt-cleanup: reached the 80-page (2000-deployment) scan cap; some older closed PRs' reports may remain. Re-run, or raise the cap.",
      );
    }
  }
  return byPr;
}

// Is PR <n> still open? Unknown (no GitHub token, or an API hiccup) => treat as
// open so we never delete a live PR's report.
async function isOpen(n) {
  if (!ghToken || !repo) return n !== triggeringPr; // no API: only the triggering PR is known-closed
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/pulls/${n}`, {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        "User-Agent": "vrt-cleanup",
      },
    });
    if (!res.ok) return true; // unknown => keep
    const json = await res.json().catch(() => null);
    if (!json || typeof json.state !== "string") return true; // malformed 200 => keep
    return json.state === "open";
  } catch {
    return true; // unknown => keep
  }
}

async function del(id) {
  try {
    const res = await fetch(`${base}/${id}?force=true`, {
      method: "DELETE",
      headers: cfHeaders,
    });
    console.log(`vrt-cleanup: delete ${id} -> HTTP ${res.status}`);
  } catch (e) {
    console.log(`vrt-cleanup: delete ${id} failed: ${e.message}`);
  }
}

const byPr = await deploymentsByPr();
// Always include the triggering PR even if its deployments paged out.
if (triggeringPr && !byPr.has(triggeringPr)) byPr.set(triggeringPr, []);

let deleted = 0;
for (const [n, ids] of byPr) {
  // Re-check live state for EVERY PR including the triggering one: a PR closed
  // and quickly reopened before this queued job runs must not have its live
  // preview deleted. isOpen fails safe to "keep" on any uncertainty (and, with
  // no GitHub token, still treats only the triggering PR as known-closed).
  if (await isOpen(n)) continue;
  for (const id of ids) {
    await del(id);
    deleted += 1;
  }
}
console.log(
  `vrt-cleanup: swept ${byPr.size} PR alias(es); deleted ${deleted} deployment(s).`,
);
