#!/usr/bin/env node
/**
 * Design-system adherence checks for apps/web.
 * Run via `pnpm run check:design` (part of `pnpm run check`).
 *
 * apps/web/DESIGN.md follows the DESIGN.md format spec
 * (https://github.com/google-labs-code/design.md): YAML token front matter
 * plus prose sections in a canonical order. It is the visual identity;
 * apps/web/AGENTS.md holds the Astro `PRIM-*` implementation rules.
 *
 * Four checks, each independently reported:
 *
 *  1. spec        `design.md lint` reports zero errors, and each warning
 *                 matches an allow-listed path AND message shape. A warning
 *                 of a new KIND at a known path still fails, so a contrast
 *                 regression cannot hide behind an "unreferenced token"
 *                 allowance.
 *  2. drift       Every token in DESIGN.md's front matter has the same value
 *                 as the matching custom property in src/styles/tokens.css,
 *                 AND every custom property in tokens.css is either mapped or
 *                 explicitly allow-listed here. tokens.css is what ships;
 *                 DESIGN.md is what agents and reviewers read. They must agree.
 *  3. citations   Every rule ID cited in a COMMENT resolves to a rule that
 *                 still exists, and every rule defined in DESIGN.md /
 *                 AGENTS.md is cited at least once or listed as
 *                 uncited-by-design. Rules and code stay in sync both ways.
 *  4. literals    No raw color / radius / duration / font-size / shadow /
 *                 font-weight / spacing step in a stylesheet that a token
 *                 already holds. Seven rules: COLOR-3, SHAPE-1, MOTION-1,
 *                 TYPE-2, DEPTH-1, TYPE-4, SPACE-1 (the distinct `rule:`
 *                 values in LITERAL_PATTERNS below -- keep this list and the
 *                 count in apps/web/AGENTS.md in step with that table).
 *                 Ratcheted against apps/web/design-baseline.json.
 *
 * Parsing notes, all of which exist because a naive version got them wrong:
 * CSS is tokenized with a small string-aware scanner rather than regex alone,
 * so a brace or a comment opener inside a quoted value cannot truncate the
 * parse; `var()` is stripped from a declaration before the literal test, so
 * mixing one token with one raw value is not a free pass; rule IDs are matched
 * only inside comments, so page copy or a URL containing "COLOR-9" can neither
 * fail the build nor falsely satisfy a citation.
 *
 * Dependency-free apart from the vendored `design.md` CLI, matching
 * scripts/check/docs.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { isNestedCheckout, REPO_ROOT } from "../lib/paths.mjs";

const SELF = fileURLToPath(import.meta.url);
const root = REPO_ROOT;
const WEB = path.join(root, "apps/web");
const DESIGN_MD = path.join(WEB, "DESIGN.md");
const AGENTS_MD = path.join(WEB, "AGENTS.md");
const TOKENS_CSS = path.join(WEB, "src/styles/tokens.css");
const BASELINE_FILE = path.join(WEB, "design-baseline.json");
const SRC = path.join(WEB, "src");

/**
 * Files outside apps/web/src that cite rule IDs and would otherwise rot
 * silently. The skill is what agents load first, so a stale ID there is the
 * most expensive one in the repo.
 */
const EXTRA_CITERS = [path.join(root, ".agents/skills/design-system/SKILL.md")];

const problems = [];
const err = (check, msg) => problems.push(`[${check}] ${msg}`);
const relative = (abs) => path.relative(root, abs).split(path.sep).join("/");

// ---------------------------------------------------------------------------
// Shared parsing helpers
// ---------------------------------------------------------------------------

/**
 * Blank every CSS comment, preserving line numbers and column widths, while
 * respecting string literals: a comment opener inside `content: "..."` must
 * not start a comment. Returns the blanked source plus the comment spans, so
 * the citation check can read exactly the text the literal check ignores.
 */
function scanCss(css) {
  const out = [...css];
  const comments = [];
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      while (i < css.length && css[i] !== quote) i += css[i] === "\\" ? 2 : 1;
      i++;
    } else if (c === "/" && css[i + 1] === "*") {
      const start = i;
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      for (let j = start; j < stop; j++) if (out[j] !== "\n") out[j] = " ";
      comments.push({ start, text: css.slice(start, stop) });
      i = stop;
    } else i++;
  }
  return { code: out.join(""), comments };
}

/** Strip `var(...)`, including nesting, from a declaration value. */
const withoutVars = (value) => {
  let previous;
  let out = value;
  do {
    previous = out;
    out = out.replace(/var\([^()]*\)/g, " ");
  } while (out !== previous);
  return out;
};

/** Walk a directory, following symlinks but never revisiting a real path. */
function walk(dir, out = [], seen = new Set()) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const abs = path.join(dir, entry.name);
    let stat;
    try {
      stat = fs.statSync(abs); // follows symlinks, unlike the Dirent
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (isNestedCheckout(abs)) continue;
      const real = fs.realpathSync(abs);
      if (seen.has(real)) continue;
      seen.add(real);
      walk(abs, out, seen);
    } else out.push(abs);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. spec
// ---------------------------------------------------------------------------

/**
 * Linter warnings that are correct for this design system and are not going
 * away, keyed by `severity path` with a required message shape.
 *
 * The message pattern matters: without it, allow-listing `colors.focus` for
 * being unreferenced would also swallow a future contrast warning at the very
 * token the focus ring's accessibility depends on.
 *
 * All of these are "defined but never referenced by any component": functional
 * tokens (focus ring, form success/error, the single-use hackathon highlight)
 * and steps of the neutral ramp that components consume through CSS rather
 * than through a component token. The spec's `components` block only has
 * backgroundColor / textColor / typography / rounded / padding / size /
 * height / width, so a border color or an outline color has nowhere to be
 * declared. Deleting the tokens to silence the warning would be wrong: they
 * ship in tokens.css.
 */
const UNREFERENCED = /is defined but never referenced/;
const ALLOWED_WARNINGS = new Map([
  ["warning colors.neutral-darkest", UNREFERENCED],
  ["warning colors.neutral-darker", UNREFERENCED],
  ["warning colors.neutral", UNREFERENCED],
  ["warning colors.neutral-light", UNREFERENCED],
  ["warning colors.success", UNREFERENCED],
  ["warning colors.success-light", UNREFERENCED],
  ["warning colors.error-light", UNREFERENCED],
  ["warning colors.focus", UNREFERENCED],
  ["warning colors.highlight", UNREFERENCED],
]);

function designCli(args) {
  return execFileSync(
    process.execPath,
    [path.join(root, "node_modules/@google/design.md/dist/index.js"), ...args],
    { encoding: "utf8", cwd: root, maxBuffer: 16 * 1024 * 1024 },
  );
}

function checkSpec() {
  let report;
  try {
    report = JSON.parse(designCli(["lint", relative(DESIGN_MD)]));
  } catch (cause) {
    // A future CLI may exit non-zero when it finds errors; parse its stdout
    // before giving up, so real findings are not reduced to "could not run".
    try {
      report = JSON.parse(cause.stdout ?? "");
    } catch {
      err("spec", `design.md lint could not run: ${cause.message}`);
      return;
    }
  }
  if (!Array.isArray(report?.findings)) {
    err(
      "spec",
      "design.md lint returned no findings array; the CLI output shape changed.",
    );
    return;
  }

  const seen = new Set();
  for (const finding of report.findings) {
    if (finding.severity === "info") continue;
    const key = finding.path
      ? `${finding.severity} ${finding.path}`
      : finding.severity;
    const allowed = ALLOWED_WARNINGS.get(key);
    if (finding.severity === "error") {
      err("spec", `DESIGN.md: ${finding.path ?? "(file)"}: ${finding.message}`);
    } else if (allowed && allowed.test(finding.message)) {
      seen.add(key);
    } else {
      err(
        "spec",
        `DESIGN.md: unexpected ${finding.severity} at ${finding.path ?? "(file)"}: ${finding.message}\n` +
          `        Fix it, or add "${key}" to ALLOWED_WARNINGS in scripts/check/design.mjs with a message pattern and a reason.`,
      );
    }
  }

  for (const stale of ALLOWED_WARNINGS.keys()) {
    if (!seen.has(stale)) {
      err(
        "spec",
        `ALLOWED_WARNINGS in scripts/check/design.mjs still lists "${stale}", but the linter no longer reports it. Remove the entry.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. drift
// ---------------------------------------------------------------------------

/**
 * tokens.css custom properties that intentionally have no DESIGN.md front
 * matter counterpart. Every entry needs a reason: this list is the only way a
 * token escapes the drift check, so an unexplained addition here is a smell.
 */
const UNMAPPED_TOKENS = new Map([
  [
    "--color-overlay",
    "rgb() with alpha; the spec Color type has no alpha-aware equivalent worth mirroring",
  ],
  [
    "--font-primary",
    "font wiring (Astro Fonts API indirection), governed by the Typography prose (TYPE-3)",
  ],
  [
    "--padding-global",
    "a percentage, not a spec Dimension; carried on components.container.padding instead",
  ],
  [
    "--text-size-regular",
    "the same 1rem step as typography.body; one entry, not two",
  ],
  [
    "--heading-line-height-tight",
    "line heights are not in the dtcg export surface; governed by the Typography prose",
  ],
  ["--heading-line-height-normal", "see --heading-line-height-tight"],
  ["--heading-line-height-loose", "see --heading-line-height-tight"],
  ["--text-body-line-height", "see --heading-line-height-tight"],
  ["--radius-circle", "50%, not a spec Dimension (number + px/em/rem)"],
  [
    "--ease-snappy",
    "the spec has no motion token group; governed by the Motion prose (MOTION-1)",
  ],
  ["--ease-emphasized", "see --ease-snappy"],
  ["--ease-buttery", "see --ease-snappy"],
  ["--duration-open", "see --ease-snappy"],
  ["--duration-close", "see --ease-snappy"],
  ["--duration-icon", "see --ease-snappy"],
  ["--duration-hover", "see --ease-snappy"],
  ["--duration-page", "see --ease-snappy"],
  [
    "--shadow-subtle",
    "the spec has no shadow token group; governed by the Elevation prose (DEPTH-1)",
  ],
  ["--shadow-card", "see --shadow-subtle"],
  ["--shadow-card-hover", "see --shadow-subtle"],
  ["--shadow-lifted", "see --shadow-subtle"],
  ["--shadow-floating", "see --shadow-subtle"],
  [
    "--font-weight-light",
    "the spec carries weight only inside a composite typography token, not standalone (TYPE-4)",
  ],
  ["--font-weight-regular", "see --font-weight-light"],
  ["--font-weight-medium", "see --font-weight-light"],
  ["--font-weight-extrabold", "see --font-weight-light"],
  ["--font-weight-semibold", "see --font-weight-light"],
  ["--duration-reveal", "see --ease-snappy"],
]);

/** DESIGN.md front matter path -> tokens.css custom property. */
function tokenMap(dtcg) {
  const map = new Map();
  for (const name of Object.keys(dtcg.color ?? {})) {
    if (!name.startsWith("$")) map.set(`colors.${name}`, `--color-${name}`);
  }
  for (const name of Object.keys(dtcg.rounded ?? {})) {
    if (!name.startsWith("$")) map.set(`rounded.${name}`, `--radius-${name}`);
  }
  // Spacing names describe roles, so they do not share one prefix.
  map.set("spacing.section", "--section-padding");
  map.set("spacing.section-small", "--section-padding-small");
  map.set("spacing.section-gap", "--section-gap");
  map.set("spacing.section-header-gap", "--section-header-gap");
  map.set("spacing.space-2xs", "--space-2xs");
  map.set("spacing.space-xs", "--space-xs");
  map.set("spacing.space-sm", "--space-sm");
  map.set("spacing.space-md", "--space-md");
  map.set("spacing.space-lg", "--space-lg");
  map.set("spacing.space-xl", "--space-xl");
  map.set("spacing.container-large", "--container-large");
  map.set("spacing.container-medium", "--container-medium");
  map.set("spacing.container-small", "--container-small");
  map.set("spacing.container-marquee", "--container-marquee");
  for (const name of Object.keys(dtcg.typography ?? {})) {
    if (name.startsWith("$")) continue;
    map.set(
      `typography.${name}.fontSize`,
      name.startsWith("body")
        ? name === "body"
          ? "--text-body-size"
          : `--text-size-${name.slice("body-".length)}`
        : `--heading-${name}-size`,
    );
  }
  map.set("typography.h1.fontWeight", "--heading-weight");
  map.set("typography.h1-home.fontWeight", "--heading-weight-home");
  return map;
}

/**
 * Collect every `:root` block. A single-block parser would let a second
 * `:root { --color-navy: red }` appended to the file ship a different value
 * than DESIGN.md documents, with a green build. Blocks nested inside an
 * `@media` are the deliberate responsive overrides, so their values are not
 * compared, but their names still count as declared: a breakpoint-only token
 * must still be described or allow-listed.
 */
function parseRootTokens(rawCss) {
  const { code } = scanCss(rawCss);
  const declared = new Map();
  const responsiveOnly = new Set();

  for (const match of code.matchAll(/:root\b[^{}]*\{/g)) {
    const open = match.index + match[0].length - 1;
    // Only a real breakpoint media query may skip value comparison. Counting
    // depth alone let `@media all { :root { --color-navy: red } }` and
    // `@layer base { :root { ... } }` ship a different value with a green build.
    const preludes = [];
    let last = 0;
    for (let i = 0; i < open; i++) {
      if (code[i] === "{") {
        preludes.push(code.slice(last, i));
        last = i + 1;
      } else if (code[i] === "}") {
        preludes.pop();
        last = i + 1;
      }
    }
    const nesting =
      preludes.length > 0 &&
      preludes.every(
        (p) =>
          /@media\b[^{]*\b(?:width|width:)/.test(p) ||
          /@media\b[^{]*\(/.test(p),
      )
        ? 1
        : 0;
    let end = code.length;
    let depth = 0;
    for (let i = open; i < code.length; i++) {
      if (code[i] === "{") depth++;
      else if (code[i] === "}" && --depth === 0) {
        end = i;
        break;
      }
    }
    for (const [, name, value] of code
      .slice(open, end)
      .matchAll(/(--[\w-]+)\s*:\s*([^;}]+)[;}]?/g)) {
      if (nesting > 0) {
        if (!declared.has(name)) responsiveOnly.add(name);
      } else {
        declared.set(name, value.trim());
        responsiveOnly.delete(name);
      }
    }
  }
  if (declared.size === 0)
    throw new Error("no top-level :root declarations found");

  const resolve = (name, seen = new Set()) => {
    const value = declared.get(name);
    if (value === undefined || seen.has(name)) return value;
    const alias = value.match(/^var\(\s*(--[\w-]+)\s*(?:,([^)]*))?\)$/);
    if (!alias) return value;
    seen.add(name);
    return resolve(alias[1], seen) ?? (alias[2]?.trim() || value);
  };
  return { declared, responsiveOnly, resolve };
}

const normalizeHex = (value) => {
  const hex = value.trim().toLowerCase();
  const short = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  return short
    ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
    : hex;
};

function dtcgValue(dtcg, tokenPath) {
  const [group, ...rest] = tokenPath.split(".");
  const groupKey = {
    colors: "color",
    rounded: "rounded",
    spacing: "spacing",
    typography: "typography",
  }[group];
  const node = dtcg[groupKey]?.[rest[0]];
  if (!node) return undefined;
  if (groupKey === "color") return normalizeHex(node.$value.hex);
  if (groupKey === "typography") {
    const field = node.$value?.[rest[1]];
    if (field === undefined) return undefined;
    return typeof field === "object"
      ? `${field.value}${field.unit}`
      : String(field);
  }
  return `${node.$value.value}${node.$value.unit}`;
}

function checkDrift() {
  let dtcg;
  try {
    dtcg = JSON.parse(
      designCli(["export", relative(DESIGN_MD), "--format", "dtcg"]),
    );
  } catch (cause) {
    err("drift", `design.md export could not run: ${cause.message}`);
    return;
  }

  let tokens;
  try {
    tokens = parseRootTokens(fs.readFileSync(TOKENS_CSS, "utf8"));
  } catch (cause) {
    err("drift", `${relative(TOKENS_CSS)}: ${cause.message}`);
    return;
  }

  const map = tokenMap(dtcg);
  const mapped = new Set(map.values());

  for (const [tokenPath, cssVar] of map) {
    const expected = dtcgValue(dtcg, tokenPath);
    if (expected === undefined) continue;
    const actual = tokens.resolve(cssVar);
    if (actual === undefined) {
      err(
        "drift",
        `DESIGN.md declares ${tokenPath}, but ${relative(TOKENS_CSS)} has no ${cssVar}. Add the token or drop the front matter entry.`,
      );
      continue;
    }
    const same = expected.startsWith("#")
      ? normalizeHex(actual) === expected
      : actual.replace(/\s+/g, "") === expected;
    if (!same) {
      err(
        "drift",
        `${tokenPath} is "${expected}" in DESIGN.md but ${cssVar} is "${actual}" in ${relative(TOKENS_CSS)}. Change both in the same edit.`,
      );
    }
  }

  for (const cssVar of [...tokens.declared.keys(), ...tokens.responsiveOnly]) {
    if (mapped.has(cssVar) || UNMAPPED_TOKENS.has(cssVar)) continue;
    err(
      "drift",
      `${relative(TOKENS_CSS)} declares ${cssVar}, which DESIGN.md does not describe.\n` +
        `        Add it to the front matter, or add it to UNMAPPED_TOKENS in scripts/check/design.mjs with a reason.`,
    );
  }
  for (const cssVar of UNMAPPED_TOKENS.keys()) {
    if (!tokens.declared.has(cssVar) && !tokens.responsiveOnly.has(cssVar)) {
      err(
        "drift",
        `UNMAPPED_TOKENS in scripts/check/design.mjs lists ${cssVar}, which no longer exists in ${relative(TOKENS_CSS)}. Remove the entry.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. citations
// ---------------------------------------------------------------------------

/** Rule IDs that legitimately have no citation in code. */
const UNCITED_RULES = new Set([
  "TYPE-3", // font wiring lives in Base.astro config, not a styled component
]);

const FAMILIES = "LAYOUT|COLOR|TYPE|DEPTH|SHAPE|COMP|MOTION|PRIM";
const RULE_ID = new RegExp(`\\b(?:${FAMILIES})-\\d+\\b`, "g");

/**
 * Comment spans of a source file, with absolute offsets. Rule IDs are only
 * meaningful inside comments: page copy, a URL, or a CSS class containing
 * "COLOR-9" must neither fail the build nor satisfy a citation.
 */
function commentSpans(file, text) {
  // A doc is all prose, minus fenced examples: an illustrative ID in a code
  // fence must neither fail the build nor satisfy a citation. Blank the fence
  // rather than removing it, so line numbers survive.
  if (file.endsWith(".md")) {
    return [
      {
        start: 0,
        text: text.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, " ")),
      },
    ];
  }
  const spans = [];
  if (file.endsWith(".css")) {
    // Real CSS: the string-aware scanner is correct and matters (`content: "/*"`).
    spans.push(...scanCss(text).comments);
  } else {
    // .astro/.ts are mostly markup and prose, where an apostrophe ("component's")
    // is not a string opener. Using the CSS scanner here silently swallowed every
    // comment after the first apostrophe, so match block comments plainly.
    for (const m of text.matchAll(/\/\*[\s\S]*?\*\//g))
      spans.push({ start: m.index, text: m[0] });
  }
  for (const m of text.matchAll(/(?:^|[^:\w"'])\/\/[^\n]*/g))
    spans.push({ start: m.index, text: m[0] });
  for (const m of text.matchAll(/<!--[\s\S]*?-->/g))
    spans.push({ start: m.index, text: m[0] });
  return spans;
}

function checkCitations() {
  const defined = new Map(); // id -> defining file
  for (const file of [DESIGN_MD, AGENTS_MD]) {
    const text = fs.readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, ""); // ignore fenced examples
    // A rule is DEFINED by a bold lead-in at the start of a line:
    // "**LAYOUT-1 One page width.**". Anchoring stops an ordinary bold
    // mention of an existing rule from registering as a second definition.
    for (const [, id] of text.matchAll(
      new RegExp(`^\\*\\*((?:${FAMILIES})-\\d+)\\s`, "gm"),
    )) {
      if (defined.has(id)) {
        err(
          "citations",
          `rule ${id} is defined twice (${relative(defined.get(id))} and ${relative(file)})`,
        );
      }
      defined.set(id, file);
    }
  }
  if (defined.size === 0) {
    err(
      "citations",
      'no rule definitions found; expected bold lead-ins like "**LAYOUT-1 One page width.**"',
    );
    return;
  }

  const cited = new Set();
  // A missing citer must fail loudly. Silently skipping it (the obvious
  // `.filter(existsSync)`) means renaming one of these files quietly stops
  // validating the rule IDs inside it, which is exactly the rot this checks for.
  for (const f of EXTRA_CITERS) {
    if (!fs.existsSync(f)) {
      err(
        "citations",
        `${relative(f)} is listed in EXTRA_CITERS but does not exist. Update the path in scripts/check/design.mjs.`,
      );
    }
  }
  const files = [
    ...walk(SRC).filter((f) => /\.(astro|css|ts|tsx|js|mjs)$/.test(f)),
    ...EXTRA_CITERS.filter((f) => fs.existsSync(f)),
  ];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const span of commentSpans(file, text)) {
      for (const match of span.text.matchAll(RULE_ID)) {
        const id = match[0];
        cited.add(id);
        if (!defined.has(id)) {
          const line = text
            .slice(0, span.start + match.index)
            .split("\n").length;
          err(
            "citations",
            `${relative(file)}:${line} cites ${id}, which is not defined in DESIGN.md or AGENTS.md`,
          );
        }
      }
    }
  }

  // DESIGN.md carries a "Rule index" table. A hand-maintained index is worth
  // having (it is the first thing an agent reads) but only if it cannot drift,
  // so require it to list exactly the rules DESIGN.md defines.
  const designText = fs.readFileSync(DESIGN_MD, "utf8");
  const indexStart = designText.indexOf("## Rule index");
  if (indexStart === -1) {
    err("citations", 'apps/web/DESIGN.md has no "## Rule index" section.');
  } else {
    const nextHeading = designText.indexOf("\n## ", indexStart + 1);
    const table = designText.slice(
      indexStart,
      nextHeading === -1 ? designText.length : nextHeading,
    );
    const listed = new Set(
      [
        ...table.matchAll(
          new RegExp(
            `^[ \\t]*\\|\\s*\`?((?:${FAMILIES})-\\d+)\`?\\s*\\|`,
            "gm",
          ),
        ),
      ].map((m) => m[1]),
    );
    const own = [...defined]
      .filter(([, file]) => file === DESIGN_MD)
      .map(([id]) => id);
    for (const id of own) {
      if (!listed.has(id))
        err(
          "citations",
          `apps/web/DESIGN.md defines ${id} but the Rule index does not list it.`,
        );
    }
    for (const id of listed) {
      if (!own.includes(id))
        err(
          "citations",
          `the Rule index lists ${id}, which DESIGN.md no longer defines.`,
        );
    }
  }

  for (const [id, file] of defined) {
    if (cited.has(id) || UNCITED_RULES.has(id)) continue;
    err(
      "citations",
      `rule ${id} (${relative(file)}) is never cited.\n` +
        `        Cite it where it applies, or add it to UNCITED_RULES in scripts/check/design.mjs with a reason.`,
    );
  }
  for (const id of UNCITED_RULES) {
    if (cited.has(id))
      err(
        "citations",
        `UNCITED_RULES lists ${id}, but it is now cited. Remove the entry.`,
      );
  }

  // STYLE.md was a doc, so a stale reference to it would land in a doc. Scan
  // the whole repo's text, not just apps/web/src.
  for (const file of walk(root)) {
    if (
      file === SELF ||
      !/\.(md|astro|css|ts|tsx|js|mjs|jsonc?|ya?ml)$/.test(file)
    )
      continue;
    if (/\/(dist|\.astro|\.wrangler|\.vercel|\.next)\//.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const at = text.search(/\bSTYLE\.md\b/);
    if (at !== -1) {
      err(
        "citations",
        `${relative(file)}:${text.slice(0, at).split("\n").length} references STYLE.md, which was replaced by DESIGN.md`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. literals
// ---------------------------------------------------------------------------

/**
 * The literal scan runs against a RATCHET, not an allowlist. apps/web has a
 * long tail of raw literals inherited from the Webflow port; blocking every
 * one of them today would just get the check disabled. Instead
 * design-baseline.json records the NORMALIZED VALUES each file currently
 * carries per rule, and this check fails when a value appears that is not in
 * the baseline, or when a baselined value is gone (stale entry, tighten it).
 *
 * Values, not counts: a count-based ratchet lets a one-for-one swap through,
 * so an off-brand color could replace a subtle shadow for free.
 *
 * Regenerate with `pnpm run check:design --update-baseline` after a cleanup,
 * and never to admit a fresh violation.
 */
const NAMED_COLORS =
  "black|white|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|navy|teal|olive|maroon|aqua|fuchsia|lime";
/** Values that have a --space-* token; a raw one of these is the violation. */
const SPACE_STEPS = ["0.5rem", "0.75rem", "1rem", "1.5rem", "2rem", "3rem"];

const COLOR_PROPS =
  "color|background|background-color|background-image|border|border-[a-z-]+|outline|outline-color|box-shadow|text-shadow|column-rule|caret-color|accent-color|text-decoration-color|fill|stroke";

const LITERAL_PATTERNS = [
  // `transparent` and `currentcolor` are keywords, not palette choices.
  { rule: "COLOR-3", what: "hex literal", re: /#[0-9a-f]{3,8}\b/gi },
  // A color function is only a violation if a RAW color survives inside it.
  // `color-mix(in srgb, var(--color-navy) 55%, transparent)` is the sanctioned
  // way to tint a token and must not be flagged; `rgb(0 0 0 / 0.5)` must be.
  {
    rule: "COLOR-3",
    what: "color function with a raw value",
    re: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\((?:[^()]|\([^()]*\))*\)/gi,
  },
  {
    // Match the whole declaration, not just a bare value: `border: 1px solid red`,
    // `color: red !important` and `linear-gradient(red, blue)` are all violations.
    rule: "COLOR-3",
    what: "named color",
    re: new RegExp(`(?:^|[\\s;{])(?:${COLOR_PROPS})\\s*:[^;}]+[;}]`, "gi"),
  },
  {
    rule: "SHAPE-1",
    what: "radius literal",
    re: /\bborder(?:-[a-z]+)*-radius\s*:[^;}]+[;}]/gi,
  },
  { rule: "MOTION-1", what: "easing literal", re: /cubic-bezier\(/gi },
  {
    rule: "TYPE-2",
    what: "font-size literal",
    re: /\bfont(?:-size)?\s*:[^;}]+[;}]/gi,
  },
  {
    rule: "MOTION-1",
    what: "duration literal",
    re: /\b(?:transition|animation)[\w-]*\s*:[^;}]+[;}]/gi,
  },
  { rule: "DEPTH-1", what: "shadow literal", re: /box-shadow\s*:[^;}]+[;}]/gi },
  {
    rule: "TYPE-4",
    what: "bare font-weight",
    re: /font-weight\s*:[^;}]*\b\d{3}\b[^;}]*[;}]/gi,
  },
  // SPACE-1: spacing was the one token group with no ratchet, and it showed in
  // mixed shorthands where one axis is a scale step written raw
  // (`margin: 0.25rem 0 0` is fine, `gap: 3rem 1.25rem` hides a --space-xl).
  {
    rule: "SPACE-1",
    what: "off-scale spacing",
    re: /\b(?:gap|row-gap|column-gap|margin|padding)(?:-(?:block|inline|top|right|bottom|left))?(?:-(?:start|end))?\s*:[^;}]+[;}]/gi,
  },
  // A local custom property is a hiding place: `--d: 750ms` then
  // `transition: all var(--d)` passes every property-anchored pattern above.
  {
    rule: "MOTION-1",
    what: "duration in a local custom property",
    re: /--[\w-]+\s*:[^;}]*\b[\d.]+m?s\b[^;}]*[;}]/gi,
  },
];

/** Does this matched declaration still hold a raw literal once tokens are removed? */
function isRawLiteral(rule, match, what) {
  const value = withoutVars(match);
  if (rule === "DEPTH-1")
    return /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/i.test(
      value,
    );
  if (what === "named color") {
    // Only the value side, with tokens, urls and property names removed, so
    // `--color-navy` and `url(/red.png)` do not read as the keyword `navy`/`red`.
    const side = withoutVars(match.replace(/^[^:]*:/, "")).replace(
      /url\([^()]*\)/gi,
      " ",
    );
    return new RegExp(`(?<![\\w-])(?:${NAMED_COLORS})(?![\\w-])`, "i").test(
      side,
    );
  }
  if (rule === "COLOR-3") {
    if (match.startsWith("#")) return true;
    // color-mix is the only listed function that legitimately consumes a token
    // as a whole color; rgb(var(--triple)) is still a hand-spelled color.
    if (/^(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i.test(match.trim()))
      return true;
    // Strip the mixing ratios and keywords a token-only mix legitimately has,
    // then look for anything that is still a color spelled out by hand.
    const bare = value
      .replace(
        /\b(?:in\s+\w+(?:\s+\w+)?|transparent|currentcolor|none)\b/gi,
        " ",
      )
      .replace(/calc\([^()]*\)/gi, " ")
      .replace(/[\d.]+%/g, " ");
    return (
      /#[0-9a-f]{3,8}\b/i.test(bare) ||
      new RegExp(`\\b(?:${NAMED_COLORS})\\b`, "i").test(bare) ||
      /[\d.]+/.test(bare)
    );
  }
  if (rule === "SHAPE-1") return /\b[\d.]+(?:px|rem|em|%)/i.test(value);
  // clamp() endpoints are responsive maths, not a scale step.
  if (rule === "TYPE-2")
    return !/clamp\(/i.test(value) && /\b[\d.]+(?:px|rem|em)/i.test(value);
  if (rule === "TYPE-4") return /\b\d{3}\b/.test(value);
  // Only flag a length that IS a scale step: off-scale one-offs stay raw by
  // policy (see DESIGN.md Layout), so this catches the token that was missed,
  // not every hand-written spacing value.
  if (rule === "SPACE-1")
    return SPACE_STEPS.some((step) =>
      new RegExp(`(?<![\\w.-])${step}(?![\\w.-])`).test(value),
    );
  if (rule === "MOTION-1")
    return /cubic-bezier\(/i.test(match) || /\b[\d.]+m?s\b/i.test(value);
  return true;
}

const normalizeLiteral = (s) =>
  s.trim().replace(/\s+/g, " ").replace(/[;}]$/, "").trim().toLowerCase();

/** Style sources: every `<style>` block in .astro, inline style attributes, and whole .css files. */
function styleSources(file, text) {
  if (file.endsWith(".css")) return [{ body: text, offset: 0 }];
  const blocks = [];
  for (const m of text.matchAll(/(<style[^>]*>)([\s\S]*?)<\/style>/g)) {
    blocks.push({ body: m[2], offset: m.index + m[1].length });
  }
  for (const m of text.matchAll(/\bstyle\s*=\s*"([^"]*)"/g)) {
    blocks.push({ body: m[1], offset: m.index + m[0].indexOf(m[1]) });
  }
  return blocks;
}

function scanLiterals() {
  const found = {}; // file -> rule -> [normalized values]
  const sites = new Map(); // "file rule value" -> "file:line what"
  const files = walk(SRC)
    .filter((f) => /\.(astro|css)$/.test(f) && f !== TOKENS_CSS)
    .sort();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const key = relative(file);
    for (const { body, offset } of styleSources(file, text)) {
      const scannable = scanCss(body).code;
      for (const { rule, what, re } of LITERAL_PATTERNS) {
        for (const match of scannable.matchAll(
          new RegExp(re.source, re.flags),
        )) {
          if (!isRawLiteral(rule, match[0], what)) continue;
          const value = normalizeLiteral(match[0]);
          const line = text.slice(0, offset + match.index).split("\n").length;
          found[key] ??= {};
          (found[key][rule] ??= []).push(value);
          if (!sites.has(`${key} ${rule} ${value}`))
            sites.set(`${key} ${rule} ${value}`, `${key}:${line} ${what}`);
        }
      }
    }
  }
  for (const rules of Object.values(found))
    for (const list of Object.values(rules)) list.sort();
  return { found, sites };
}

function checkLiterals({ updateBaseline }) {
  const { found, sites } = scanLiterals();

  if (updateBaseline) {
    fs.writeFileSync(
      BASELINE_FILE,
      `${JSON.stringify(
        {
          $comment:
            "Ratchet for scripts/check/design.mjs. Raw CSS literals inherited from the Webflow port, listed per file per rule as normalized values. Entries may only be REMOVED. Regenerate with `pnpm run check:design --update-baseline` AFTER removing literals, never to admit new ones.",
          files: found,
        },
        null,
        2,
      )}\n`,
    );
    console.log(
      `check-design: baseline rewritten (${relative(BASELINE_FILE)}).`,
    );
    return;
  }

  let baseline;
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8")).files ?? {};
  } catch (cause) {
    err(
      "literals",
      `${relative(BASELINE_FILE)} is missing or unreadable (${cause.message}).`,
    );
    return;
  }

  for (const key of new Set([
    ...Object.keys(found),
    ...Object.keys(baseline),
  ])) {
    for (const rule of new Set([
      ...Object.keys(found[key] ?? {}),
      ...Object.keys(baseline[key] ?? {}),
    ])) {
      const now = [...(found[key]?.[rule] ?? [])];
      const remaining = [...(baseline[key]?.[rule] ?? [])];
      const added = [];
      for (const value of now) {
        const at = remaining.indexOf(value);
        if (at === -1) added.push(value);
        else remaining.splice(at, 1);
      }
      if (added.length) {
        err(
          "literals",
          `${key}: ${added.length} new ${rule} violation(s). Use a token instead of a raw literal:\n` +
            added
              .map(
                (v) =>
                  `          ${sites.get(`${key} ${rule} ${v}`) ?? key} "${v}"`,
              )
              .join("\n"),
        );
      }
      if (remaining.length) {
        err(
          "literals",
          `${key}: ${remaining.length} baselined ${rule} literal(s) are gone (${remaining.join(", ")}).\n` +
            `        Tighten the ratchet: \`pnpm run check:design --update-baseline\`.`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------

const updateBaseline = process.argv.slice(2).includes("--update-baseline");

// The other three always run: `--update-baseline` must never be a way to get
// a green build without them.
checkSpec();
checkDrift();
checkCitations();
checkLiterals({ updateBaseline });

if (problems.length) {
  console.error(`check-design: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nRules: apps/web/DESIGN.md (visual identity), apps/web/AGENTS.md (PRIM-* primitives).",
  );
  process.exit(1);
}
console.log(
  "check-design: DESIGN.md is spec-valid, in sync with tokens.css, and cited consistently.",
);
