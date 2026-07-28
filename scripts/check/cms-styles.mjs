#!/usr/bin/env node
/**
 * Styling gate for the custom Payload admin surfaces (`check:cms-styles`).
 *
 * Why this exists as its own script rather than an extension of design.mjs:
 * design.mjs is scoped to apps/web (it walks apps/web/src and carries its own
 * ratchet baseline), and its inline-style scanner matches the HTML attribute
 * form `style="..."`, so it cannot see React's `style={{ ... }}` object form.
 * apps/cms had no styling gate at all; check:cms is types plus tests only.
 *
 * Two rules, both cheap:
 *   1. No `style={{` in apps/cms/src/components, except the allowlist below.
 *   2. custom.css keeps to Payload's tokens: no rem, no hex, no raw radius,
 *      and font sizes stay literal px (the documented sizing rule, because
 *      `1rem` in the admin is 13px and 12px below 1024px).
 *
 * Rules: apps/cms/DESIGN.md.
 */
import fs from "node:fs";
import path from "node:path";

import { REPO_ROOT } from "../lib/paths.mjs";

const COMPONENTS = path.join(REPO_ROOT, "apps/cms/src/components");
const STYLESHEET = path.join(
  REPO_ROOT,
  "apps/cms/src/app/(payload)/custom.css",
);

/**
 * Inline styles that are genuinely computed from props or state and therefore
 * cannot live in a stylesheet. Keep this list short: every entry is an
 * exception a reviewer has to accept. Value is the reason, printed on drift.
 */
const ALLOW = {
  // No entries yet. Add as `"file.tsx": "why this one value is computed"`.
};

const findings = [];

function err(file, line, text, reason) {
  findings.push({ file, line, text: text.trim().slice(0, 100), reason });
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Rule 1: no static inline style objects in the admin components.
if (fs.existsSync(COMPONENTS)) {
  for (const file of walk(COMPONENTS)) {
    const rel = path.relative(REPO_ROOT, file);
    const base = path.basename(file);
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!line.includes("style={{")) return;
      if (ALLOW[base]) return;
      err(
        rel,
        i + 1,
        line,
        "inline style object; compose from the classes in custom.css (apps/cms/DESIGN.md)",
      );
    });
  }
}

// Rule 2: the stylesheet stays on Payload's tokens.
if (fs.existsSync(STYLESHEET)) {
  const rel = path.relative(REPO_ROOT, STYLESHEET);
  const raw = fs.readFileSync(STYLESHEET, "utf8");
  // Comments explain the forbidden values on purpose, so strip them first.
  const lines = raw
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .split("\n");

  lines.forEach((line, i) => {
    const n = i + 1;
    const decl = line.split("/*")[0];
    if (!decl.trim()) return;

    if (/\b[\d.]+rem\b/.test(decl)) {
      err(
        rel,
        n,
        decl,
        "rem drifts at the 1024px breakpoint; use literal px or --qs-space-*",
      );
    }
    if (/#[0-9a-fA-F]{3,8}\b/.test(decl)) {
      err(
        rel,
        n,
        decl,
        "hex color; use a --theme-* token through a --qs-fg-*/--qs-surface role",
      );
    }
    if (/(?:theme-(?:elevation|error|success|warning))-500\b/.test(decl)) {
      err(
        rel,
        n,
        decl,
        "the -500 rung does not invert in Payload's dark theme; use -600 or -650",
      );
    }
    if (/--theme-elevation-25\b/.test(decl)) {
      err(
        rel,
        n,
        decl,
        "--theme-elevation-25 is not defined by Payload and renders transparent",
      );
    }
    if (/!important/.test(decl)) {
      err(
        rel,
        n,
        decl,
        "!important; .qs-* rules are unlayered and already outrank Payload",
      );
    }
    if (/border-radius\s*:\s*[^;]*\d/.test(decl) && !/var\(--/.test(decl)) {
      err(
        rel,
        n,
        decl,
        "raw radius; Payload ships --style-radius-s|m|l and there is no fourth",
      );
    }
    if (/font-size\s*:\s*[^;]*calc\(\s*var\(--base\)/.test(decl)) {
      err(
        rel,
        n,
        decl,
        "--base is rem derived and becomes 18.46px at the 12px root; use literal px",
      );
    }
  });
}

if (findings.length === 0) {
  console.log("check:cms-styles: OK");
  process.exit(0);
}

for (const f of findings) {
  console.error(`${f.file}:${f.line}  ${f.reason}\n    ${f.text}`);
}
console.error(
  `\ncheck:cms-styles: ${findings.length} problem(s). Rules: apps/cms/DESIGN.md.`,
);
process.exit(1);
