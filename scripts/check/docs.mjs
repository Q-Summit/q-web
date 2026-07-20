#!/usr/bin/env node
/**
 * Structural checks for the q-web repo, dependency-free (plain fs + regex).
 * Run via `pnpm run check:docs` (part of `pnpm run check`).
 *
 * Rules:
 *  - relative-links:   every relative markdown link resolves to a real file
 *  - agents-pairing:   every AGENTS.md has a sibling CLAUDE.md importing it
 *                      (a line that is exactly "@AGENTS.md"), and vice versa
 *  - skills-symlink:   .claude/skills is a symlink to .agents/skills
 *  - adr-filename:     docs/decisions/ files are NNNN-slug.md or _template.md
 *  - adr-bullets:      each ADR has the "- **Status:**" and "- **Date:**" bullets
 *  - adr-indexed:      each ADR appears in docs/architecture/09-architecture-decisions.md
 *  - no-dash:          no em/en dashes; no spaced hyphen as dash punctuation
 *                      (house style, see AGENTS.md)
 */
import fs from "node:fs";
import path from "node:path";

import { REPO_ROOT } from "../lib/paths.mjs";

const root = REPO_ROOT;
const problems = [];
const err = (file, msg) => problems.push(`${file}: ${msg}`);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".astro",
  ".next",
  ".vercel",
  ".wrangler",
  // Gitignored content-package transfer artifacts (scripts/content-packages/):
  // pulled/exported CMS content keeps its original punctuation, same as the
  // CI content fixture exemption below.
  "content-packages",
]);
// Legal text is never restyled, so the style rules do not apply to it.
const DASH_EXEMPT = new Set([
  "LICENSE.md",
  "LEGAL.md",
  // Verbatim copy of an upstream skill, kept byte-comparable so it can be
  // diffed against its source. Rewriting its punctuation to house style would
  // make that impossible. Our own commentary on it sits in the header, which
  // does follow house style.
  ".agents/skills/design-system/references/ui-animation.md",
]);
// The CI content fixture mirrors CMS/scrape-shaped data and keeps original
// punctuation (em dashes in job titles, German legal HTML). House style
// applies to authored docs and code, not content-shaped data.
// apps/web/content/ is the same kind of data: the gitignored emergency
// snapshot slot (docs/dev/go-live.md) that a CMS-outage PR commits verbatim,
// and the dir the cutover parity build restores into. Without this exemption
// the required check fails once per em dash in real CMS copy, so the
// documented recovery path could not pass CI at the moment it is needed.
const isContentSnapshot = (fileRel) =>
  fileRel.startsWith("apps/web/test/fixtures/ci-content/") ||
  fileRel.startsWith("apps/web/content/");
// Dash chars as \u escapes so this file passes its own plain-text scan.
const DASH = /[\u2013\u2014]/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(abs, out);
    } else {
      out.push(abs);
    }
  }
  return out;
}

const rel = (abs) => path.relative(root, abs).split(path.sep).join("/");
const allFiles = walk(root);
const mdFiles = allFiles.filter((f) => f.endsWith(".md"));

// Replace every non-newline character with a space: removed constructs keep
// their line numbers and column widths.
const blank = (s) => s.replace(/[^\n]/g, " ");

// Split markdown into lines with an "in fenced code block" flag per line.
// On prose lines, HTML comments (template guidance, not content) and inline
// code spans are blanked so example links and punctuation in them never trip
// the link or spaced-hyphen checks. Fences and comments are tracked in ONE
// pass so the two states cannot disagree: a "<!--" printed inside a fence is
// code and never swallows the prose below it, and a fence drawn inside a
// comment never opens a block. Fences follow CommonMark: at most 3 spaces of
// indent, a backtick fence's info string cannot contain a backtick, and a
// closing fence needs the same character, at least the opening length, and
// no info string.
function mdLines(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let open = null; // { char, len } of the current fence, or null
  let inComment = false; // inside a multi-line HTML comment
  return lines.map((raw) => {
    if (open) {
      const close = raw.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === open.char && close[1].length >= open.len)
        open = null;
      return { line: raw, inCode: true };
    }
    let line = raw;
    if (inComment) {
      const end = line.indexOf("-->");
      if (end === -1) return { line: blank(line), inCode: false };
      line = blank(line.slice(0, end + 3)) + line.slice(end + 3);
      inComment = false;
    }
    line = line.replace(/<!--[\s\S]*?-->/g, blank);
    // A multi-line comment only opens as an HTML block: "<!--" with nothing
    // but whitespace before it. A mid-line unclosed "<!--" is literal text
    // (and on a fence opener line it is info-string text), so latching on it
    // would swallow real content below, up to the end of the file.
    const start = line.indexOf("<!--");
    if (start !== -1 && line.slice(0, start).trim() === "") {
      line = blank(line);
      inComment = true;
    }
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence && !(fence[1][0] === "`" && fence[2].includes("`"))) {
      open = { char: fence[1][0], len: fence[1].length };
      return { line, inCode: true };
    }
    return { line: blankCodeSpans(line), inCode: false };
  });
}

// Blank inline code spans. CommonMark pairs a backtick run only with the
// NEXT run of exactly the same length, so unequal runs stay literal text;
// a lazy regex like /(`+).*?\1/ would backtrack into longer runs and blank
// prose (and any link in it) that is not actually a code span.
function blankCodeSpans(line) {
  const runs = [...line.matchAll(/`+/g)];
  const chars = line.split("");
  for (let i = 0; i < runs.length; i++) {
    const j = runs.findIndex(
      (r, k) => k > i && r[0].length === runs[i][0].length,
    );
    if (j === -1) continue;
    const end = runs[j].index + runs[j][0].length;
    for (let p = runs[i].index; p < end; p++) chars[p] = " ";
    i = j;
  }
  return chars.join("");
}

// --- relative-links ---------------------------------------------------------
// Matches [text](target), [text](target "title"), [text](target 'title'),
// and [text](<target>), but not escaped \[brackets\]. Parenthesized targets
// need the <...> form. Any scheme-prefixed URI (https:, mailto:, tel:, case
// insensitive) and pure #fragments are out of scope; percent-encoded paths
// are decoded the way GitHub resolves them.
const LINK =
  /(?<!\\)\[[^\]]*\]\(<([^>]+)>(?:\s+("[^"]*"|'[^']*'))?\)|(?<!\\)\[[^\]]*\]\(([^)\s]+)(?:\s+("[^"]*"|'[^']*'))?\)/g;
for (const abs of mdFiles) {
  mdLines(fs.readFileSync(abs, "utf8")).forEach(({ line, inCode }, i) => {
    if (inCode) return;
    // Blank escaped backslashes first so the lookbehind sees "\\[link]"
    // (a literal backslash followed by a real link) as unescaped.
    for (const match of line.replace(/\\\\/g, "  ").matchAll(LINK)) {
      const raw = match[1] ?? match[3];
      let target = raw;
      if (/^([a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
      target = target.split("#")[0];
      if (!target) continue;
      try {
        target = decodeURIComponent(target);
      } catch {
        // Malformed percent-encoding: keep the raw target and let the
        // existence check below report it as a broken link.
      }
      const resolved = target.startsWith("/")
        ? path.join(root, target)
        : path.resolve(path.dirname(abs), target);
      if (!fs.existsSync(resolved)) {
        err(
          rel(abs),
          `line ${i + 1}: relative link "${raw}" does not resolve to an existing file`,
        );
      }
    }
  });
}

// --- agents-pairing ---------------------------------------------------------
const hasImportLine = (abs) =>
  mdLines(fs.readFileSync(abs, "utf8")).some(
    ({ line, inCode }) => !inCode && line.trim() === "@AGENTS.md",
  );
for (const abs of allFiles.filter((f) => path.basename(f) === "AGENTS.md")) {
  const sibling = path.join(path.dirname(abs), "CLAUDE.md");
  if (!fs.existsSync(sibling))
    err(
      rel(abs),
      "has no sibling CLAUDE.md (must exist and import @AGENTS.md)",
    );
  else if (!hasImportLine(sibling))
    err(
      rel(sibling),
      'must contain a line that is exactly "@AGENTS.md" (outside code fences)',
    );
}
for (const abs of allFiles.filter((f) => path.basename(f) === "CLAUDE.md")) {
  if (!fs.existsSync(path.join(path.dirname(abs), "AGENTS.md"))) {
    err(rel(abs), "has no sibling AGENTS.md (shared rules belong there)");
  }
}

// --- skills-symlink ---------------------------------------------------------
try {
  const link = path.join(root, ".claude", "skills");
  if (!fs.lstatSync(link).isSymbolicLink()) {
    err(".claude/skills", 'is not a symlink: run "pnpm run setup"');
  } else if (
    fs.realpathSync(link) !==
    fs.realpathSync(path.join(root, ".agents", "skills"))
  ) {
    err(
      ".claude/skills",
      'symlink does not resolve to .agents/skills: run "pnpm run setup"',
    );
  }
} catch {
  err(".claude/skills", 'missing or broken symlink: run "pnpm run setup"');
}

// --- ADR rules --------------------------------------------------------------
const adrDir = path.join(root, "docs", "decisions");
const adrIndexAbs = path.join(
  root,
  "docs",
  "architecture",
  "09-architecture-decisions.md",
);
const adrIndex = fs.existsSync(adrIndexAbs)
  ? fs.readFileSync(adrIndexAbs, "utf8")
  : "";
if (fs.existsSync(adrDir)) {
  for (const name of fs.readdirSync(adrDir)) {
    if (name === "_template.md") continue;
    const fileRel = `docs/decisions/${name}`;
    if (!/^\d{4}-[a-z0-9-]+\.md$/.test(name)) {
      err(fileRel, "filename must be NNNN-kebab-slug.md (copy _template.md)");
      continue;
    }
    const text = fs.readFileSync(path.join(adrDir, name), "utf8");
    if (!/^- \*\*Status:\*\* /m.test(text))
      err(fileRel, 'missing the "- **Status:**" bullet (see _template.md)');
    if (!/^- \*\*Date:\*\* \d{4}-\d{2}-\d{2}/m.test(text))
      err(
        fileRel,
        'missing the "- **Date:** YYYY-MM-DD" bullet (see _template.md)',
      );
    if (!adrIndex.includes(name)) {
      err(
        "docs/architecture/09-architecture-decisions.md",
        `has no index row linking ${fileRel} (same-PR rule)`,
      );
    }
  }
}

// --- no-dash ----------------------------------------------------------------
for (const abs of mdFiles) {
  const fileRel = rel(abs);
  if (DASH_EXEMPT.has(fileRel)) continue;
  const raw = fs.readFileSync(abs, "utf8");
  const rawLines = raw.replace(/\r\n/g, "\n").split("\n");
  // mdLines blanks HTML comments and inline code on prose lines, so the
  // spaced-hyphen test below never fires inside them. The em/en dash test
  // still runs on the raw line: banned even in comments and code.
  mdLines(raw).forEach(({ line, inCode }, i) => {
    if (DASH.test(rawLines[i])) {
      err(
        fileRel,
        `line ${i + 1} contains an em or en dash: rewrite with a comma, colon, period, or parentheses (house style, see AGENTS.md)`,
      );
      return;
    }
    if (inCode) return;
    // Spaced hyphen as punctuation. Markdown structure is not punctuation:
    // drop table separator rows, then strip pipes and bullet markers so the
    // remaining cell/prose text is still checked.
    if (/^\s*\|?[\s:|-]+\|?\s*$/.test(line)) return;
    const prose = line.replace(/\|/g, " ").replace(/^\s*[-*+]\s+/, "");
    if (/\S\s+-\s+\S/.test(prose)) {
      err(
        fileRel,
        `line ${i + 1} uses a spaced hyphen as dash punctuation (" - "): rewrite with a comma, colon, period, or parentheses; hyphens joining words ("Same-PR") are fine (house style, see AGENTS.md)`,
      );
    }
  });
}
// Non-markdown text files (configs, scripts, workflows): em/en dashes only.
// Allowlisted text extensions plus extensionless files (git hooks,
// CODEOWNERS, dotfile configs); anything with a NUL byte up front is binary
// and skipped regardless of its name.
const TEXT_EXT =
  /\.(ya?ml|jsonc?|toml|mjs|cjs|js|ts|tsx|astro|css|html|svg|sh|txt|env|example)$/i;
for (const abs of allFiles.filter((f) => !f.endsWith(".md"))) {
  const fileRel = rel(abs);
  if (DASH_EXEMPT.has(fileRel) || isContentSnapshot(fileRel)) continue;
  const base = fileRel.split("/").pop();
  // Local operator env files (.env, .env.remote, .env.*.ready) are gitignored
  // scratch space and may carry pasted vendor text; house style applies to the
  // committed .env*.example templates only.
  if (base.startsWith(".env") && !base.endsWith(".example")) continue;
  const ext =
    base.includes(".") && !base.startsWith(".")
      ? base.slice(base.indexOf("."))
      : "";
  if (ext && !TEXT_EXT.test(base)) continue;
  const buf = fs.readFileSync(abs);
  if (buf.subarray(0, 1024).includes(0)) continue;
  const content = buf.toString("utf8");
  // Generated code (wrangler `worker-configuration.d.ts`, Payload
  // `payload-types.ts`, admin import maps) is regenerated, never hand-edited,
  // and often carries vendor docstrings with em dashes. House style applies to
  // authored text, not tool output, so skip files whose head declares them
  // generated, same rationale as the LICENSE/LEGAL exemption above.
  if (
    /generated by|auto-generated|@generated|code generated|do not edit/i.test(
      content.slice(0, 512),
    )
  )
    continue;
  content.split("\n").forEach((line, i) => {
    if (DASH.test(line))
      err(
        fileRel,
        `line ${i + 1} contains an em or en dash (house style, see AGENTS.md)`,
      );
  });
}

// --- report -----------------------------------------------------------------
if (problems.length > 0) {
  console.error(`check:docs: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("check:docs: all checks passed");
