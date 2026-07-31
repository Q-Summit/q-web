#!/usr/bin/env node
/**
 * events -- the analytics taxonomy gate (docs/dev/analytics.md). Fails when:
 *
 *  - a `data-ph-event` / `data-ph-toggle-event` / `data-ph-page-event`
 *    attribute (or a `pageEvent` name) is a raw string literal instead of an
 *    `EVENTS.*` reference, which would bypass the typed frozen taxonomy in
 *    apps/web/src/lib/analytics/events.ts;
 *  - a direct `capture("name")` call uses a name outside that taxonomy;
 *  - an analytics line carries a PII-looking property key (email / phone /
 *    name / ip / password) -- events are anonymous (ADR-0003), no PII ever;
 *  - anything calls `identify(` -- identity is forbidden by the cookieless
 *    posture (person_profiles: "never").
 *
 * The lint core (`parseAllowed`, `lintText`) is pure + exported for
 * scripts.test.mjs; the CLI runs only when invoked directly.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { argv } from "node:process";
import { pathToFileURL } from "node:url";

import { WEB_DIR } from "../lib/paths.mjs";

export const PII =
  /\b(email|phone|first_?name|last_?name|full_?name|ip_address|raw_email|password)\b/i;

/** Lines the PII key check applies to: only analytics surfaces, so content
 * types and mailto markup elsewhere never false-positive. */
const ANALYTICS_LINE = /data-ph-|pageEvent|\bcapture\(/;

/** Parse the allowed event names from the EVENTS taxonomy source. */
export function parseAllowed(eventsSrc) {
  const block = eventsSrc.match(/export const EVENTS = \{([\s\S]*?)\n\}/);
  return new Set(
    [...(block?.[1].matchAll(/^\s*(\w+):/gm) ?? [])].map((m) => m[1]),
  );
}

/** Pure: lint one file's text -> problem strings. The analytics lib itself is exempt. */
export function lintText(rel, text, allowed) {
  if (rel.startsWith("src/lib/analytics/")) return [];
  const problems = [];
  text.split("\n").forEach((line, i) => {
    const loc = `${rel}:${i + 1}`;
    // Raw string literal where a typed EVENTS.* reference belongs.
    const literalAttr = line.match(
      /data-ph-(?:toggle-|page-)?event=["']([^"']+)["']/,
    );
    if (literalAttr)
      problems.push(
        `${loc}  event attribute must reference EVENTS.* (got string literal "${literalAttr[1]}")`,
      );
    const literalPage = line.match(/pageEvent=\{\{\s*name:\s*["']([^"']+)["']/);
    if (literalPage)
      problems.push(
        `${loc}  pageEvent name must reference EVENTS.* (got string literal "${literalPage[1]}")`,
      );
    // Direct capture("...") calls must stay inside the frozen taxonomy
    // ($-prefixed names are PostHog-internal and not ours to enumerate).
    const call = line.match(/\bcapture\(\s*['"]([^'"]+)['"]/);
    if (call && !call[1].startsWith("$") && !allowed.has(call[1]))
      problems.push(`${loc}  unknown event "${call[1]}"`);
    if (/\.identify\(/.test(line))
      problems.push(
        `${loc}  identify() is forbidden (ADR-0003: anonymous events only)`,
      );
    if (ANALYTICS_LINE.test(line)) {
      const pii = line.match(PII);
      // Key position only ("email:", "email="): a VALUE like the literal
      // "email" in apply_type={isMailto ? "email" : "url"} is not PII.
      if (pii && new RegExp(`${pii[0]}\\s*[:=]`).test(line))
        problems.push(
          `${loc}  PII-looking analytics property "${pii[0]}" (events are anonymous, ADR-0003)`,
        );
    }
  });
  return problems;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|astro)$/.test(full) && !/\.test\./.test(full))
      out.push(full);
  }
  return out;
}

export function run(webDir = WEB_DIR) {
  const allowed = parseAllowed(
    readFileSync(join(webDir, "src/lib/analytics/events.ts"), "utf8"),
  );
  if (allowed.size === 0)
    throw new Error("check:events -- could not parse the EVENTS taxonomy.");
  const problems = [];
  for (const file of walk(join(webDir, "src"))) {
    const rel = relative(webDir, file).split(sep).join("/");
    problems.push(...lintText(rel, readFileSync(file, "utf8"), allowed));
  }
  return { allowed, problems };
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  const { allowed, problems } = run();
  if (problems.length) {
    console.error(`check:events -- ${problems.length} issue(s):\n`);
    for (const p of problems) console.error(`  ${p}`);
    console.error(
      "\nAdd new events to the frozen taxonomy in apps/web/src/lib/analytics/events.ts (same PR), reference them as EVENTS.*, and keep properties PII-free.",
    );
    process.exit(1);
  }
  console.log(
    `check:events -- taxonomy holds (${allowed.size} events); no literals, no PII keys, no identify().`,
  );
}
