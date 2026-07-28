// Minimal .env file parser shared by the dev-setup scripts. No dotenv
// dependency: these are plain Node ESM scripts (see docs/dev/local-development.md).
//
// Deliberately simple: KEY=VALUE per line, `#` comments, optional quotes.
// Good enough for the flat, single-line values used in this repo's .env
// files; it does not attempt full dotenv-spec compatibility (multiline
// values, variable expansion, etc).

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

/**
 * Parse a .env-style file into a plain object. Returns {} if the file does
 * not exist (callers decide whether that's an error).
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
export function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const contents = fs.readFileSync(filePath, "utf-8");
  /** @type {Record<string, string>} */
  const result = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) result[key] = value;
  }

  return result;
}

/**
 * True for missing, blank, or template placeholders (CHANGEME, REPLACE_WITH_*,
 * YOUR_*, same-as-vercel…, <angle-brackets>). Callers must treat these as unset
 * so scripts fail closed instead of calling remotes with junk credentials.
 * @param {string | undefined | null} value
 * @returns {boolean}
 */
export function isUnsetEnvValue(value) {
  if (value == null) return true;
  const v = String(value).trim();
  if (!v) return true;
  const lower = v.toLowerCase();
  if (
    lower === "changeme" ||
    lower === "todo" ||
    lower === "replace_me" ||
    lower === "xxx"
  ) {
    return true;
  }
  if (/^replace_with_/i.test(v)) return true;
  if (/^your_[a-z0-9_]+/i.test(v)) return true;
  if (/^same-as-vercel/i.test(v)) return true;
  if (/^<.*>$/.test(v)) return true;
  if (/YOUR_CMS|YOUR_ACCOUNT|YOUR_SUBDOMAIN|REPLACE_WITH_/i.test(v)) {
    return true;
  }
  return false;
}

/**
 * First source that defines `key` wins. Empty/placeholder values from that
 * source count as unset (return "") and do **not** fall through, so tests and
 * shell overrides can blank a key without the gitignored file resurrecting it.
 * @param {string} key
 * @param {...Record<string, string | undefined>} sources
 * @returns {string}
 */
export function resolveEnvValue(key, ...sources) {
  for (const src of sources) {
    if (!src || !(key in src)) continue;
    const raw = src[key];
    if (raw === undefined) continue;
    if (isUnsetEnvValue(raw)) return "";
    return String(raw).trim();
  }
  return "";
}

/**
 * @param {string[]} keys
 * @param {...Record<string, string | undefined>} sources
 * @returns {string[]}
 */
export function missingEnvKeys(keys, ...sources) {
  return keys.filter((key) => !resolveEnvValue(key, ...sources));
}

/**
 * Fail closed: throw if any required key is missing or still a placeholder.
 * @param {string} label script name for the error prefix
 * @param {string[]} keys
 * @param {...Record<string, string | undefined>} sources
 * @returns {void}
 */
export function requireEnvKeys(label, keys, ...sources) {
  const missing = missingEnvKeys(keys, ...sources);
  if (missing.length === 0) return;
  throw new Error(
    `${label}: missing or placeholder value(s): ${missing.join(", ")}.\n` +
      "  Use real values (not empty / CHANGEME / REPLACE_WITH_* / YOUR_*).",
  );
}

/**
 * Quote a .env value when it needs it. Never log the result from callers that
 * handle secrets.
 * @param {string} value
 * @returns {string}
 */
function formatEnvAssignmentValue(value) {
  const s = String(value);
  if (s === "" || /[\s#"'$`\\]/.test(s)) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}

/**
 * Upsert KEY=VALUE lines in a .env file, preserving comments and unrelated
 * keys. Creates the file (mode 0600) when missing. Does not print values.
 * @param {string} filePath
 * @param {Record<string, string>} updates
 * @returns {void}
 */
export function upsertEnvFile(filePath, updates) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return;

  const existed = fs.existsSync(filePath);
  let contents = existed ? fs.readFileSync(filePath, "utf-8") : "";
  if (contents.length > 0 && !contents.endsWith("\n")) contents += "\n";

  const lines = contents.length > 0 ? contents.split("\n") : [];
  // Drop trailing empty line from the final split so we control the ending.
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {string[]} */
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      out.push(line);
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      out.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      out.push(`${key}=${formatEnvAssignmentValue(updates[key])}`);
      seen.add(key);
    } else {
      out.push(line);
    }
  }

  for (const key of keys) {
    if (!seen.has(key)) {
      out.push(`${key}=${formatEnvAssignmentValue(updates[key])}`);
    }
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${out.join("\n")}\n`, {
    encoding: "utf-8",
    mode: 0o600,
  });
}

/**
 * Try to resolve @next/env from an app directory. It is not a direct dep of
 * the app (it ships as a dependency of `next`), so it is resolved via `next`'s
 * own install location (same pattern as `scripts/lib/s3.mjs`). Returns the
 * module's `loadEnvConfig` or null if it cannot be resolved.
 * @param {string} appDir
 * @returns {((dir: string, dev: boolean) => { combinedEnv: Record<string, string | undefined> }) | null}
 */
function tryLoadEnvConfig(appDir) {
  try {
    const requireFromApp = createRequire(path.join(appDir, "package.json"));
    const nextEnvRequire = createRequire(
      requireFromApp.resolve("next/package.json"),
    );
    return nextEnvRequire("@next/env").loadEnvConfig ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve the *effective* environment for a Next.js/Payload app directory the
 * same way the runtime does: process.env wins, then `.env.<mode>.local`,
 * `.env.local`, `.env.<mode>`, `.env` (mode = development unless NODE_ENV is
 * production/test). Uses @next/env (the exact loader `next dev` / `payload`
 * use) for parity when it can be resolved, and falls back to replicating that
 * precedence with parseEnvFile otherwise. This is why the local-db guard is
 * authoritative: a sneaked-in apps/cms/.env.local pointing at Neon overrides
 * .env at runtime, and this resolution sees that override too.
 * @param {string} appDir
 * @param {{ dev?: boolean }} [options]
 * @returns {Record<string, string | undefined>}
 */
export function resolveAppEnv(appDir, { dev = true } = {}) {
  const loadEnvConfig = tryLoadEnvConfig(appDir);
  if (loadEnvConfig) {
    // loadEnvConfig mutates the current process.env, but this runs in a
    // short-lived guard process that exits before the real dev server starts
    // (a separate process), so the mutation is inert.
    return loadEnvConfig(appDir, dev).combinedEnv;
  }

  // Fallback: replicate @next/env's file precedence (first file to define a
  // key wins; an already-set process.env value wins over all files).
  const mode =
    process.env.NODE_ENV === "test"
      ? "test"
      : process.env.NODE_ENV === "production" || !dev
        ? "production"
        : "development";
  const files = [
    `.env.${mode}.local`,
    mode !== "test" && ".env.local",
    `.env.${mode}`,
    ".env",
  ].filter(Boolean);
  /** @type {Record<string, string | undefined>} */
  const merged = {};
  for (const file of files) {
    const parsed = parseEnvFile(path.join(appDir, file));
    for (const [key, value] of Object.entries(parsed)) {
      if (merged[key] === undefined) merged[key] = value;
    }
  }
  return { ...merged, ...process.env };
}

/**
 * Extract the hostname from a Postgres connection URI. Returns null if it
 * cannot be parsed as a URL (e.g. empty string).
 * @param {string} uri
 * @returns {string | null}
 */
export function hostnameOf(uri) {
  if (!uri) return null;
  try {
    // postgres:// and postgresql:// both parse fine via the WHATWG URL API.
    return new URL(uri).hostname || null;
  } catch {
    return null;
  }
}

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * @param {string | null} hostname
 * @returns {boolean}
 */
export function isLocalHostname(hostname) {
  return !!hostname && LOCAL_HOSTNAMES.has(hostname);
}

/**
 * Extract the port from a connection URI (postgres:// or http(s)://),
 * falling back to `defaultPort` when the URI is empty, has no explicit
 * port, or does not parse.
 * @param {string} uri
 * @param {number} defaultPort
 * @returns {number}
 */
export function portOf(uri, defaultPort) {
  if (!uri) return defaultPort;
  try {
    const parsed = new URL(uri);
    return parsed.port ? Number.parseInt(parsed.port, 10) : defaultPort;
  } catch {
    return defaultPort;
  }
}
