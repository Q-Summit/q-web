#!/usr/bin/env node
// Guard rail: refuses to continue unless DATABASE_URI points at a local
// database. Runs as `predev` and before seed scripts (see
// docs/dev/local-development.md). This is the thing that makes it safe for an
// agent to run `pnpm dev` / `pnpm seed` without ever touching prod.
//
// It resolves DATABASE_URI through the SAME precedence the runtime uses
// (@next/env: process.env, then .env.<mode>.local, .env.local, .env.<mode>,
// .env). Validating only apps/cms/.env was a hole: Next/Payload also load
// .env.local / .env.development(.local), which OVERRIDE .env, so a URI hidden
// in one of those would have reached the real dev server unchecked.
//
// It also checks *port ownership*: "hostname is localhost" is not enough,
// because another docker-compose project can squat the same host ports
// (5433/9000) that this repo's docker-compose.yml publishes. If that
// happens, DATABASE_URI still resolves to "localhost" and this guard would
// otherwise print OK while the CMS silently reads/writes a different
// project's database. See docs/dev/local-development.md ("Default loop")
// for the recovery steps this error message points to.

import { execFileSync } from "node:child_process";

import {
  hostnameOf,
  isLocalHostname,
  portOf,
  resolveAppEnv,
} from "../lib/env.mjs";
import { CMS_DIR, REPO_ROOT } from "../lib/paths.mjs";

const resolvedEnv = resolveAppEnv(CMS_DIR);
const databaseUri = resolvedEnv.DATABASE_URI ?? "";

const hostname = hostnameOf(databaseUri);

function fail(
  message,
  {
    title = "REFUSING TO CONTINUE: DATABASE_URI is not local",
    footer = "This command only runs against the local docker-compose Postgres " +
      "(localhost:5433). To work against the real database, use " +
      "`pnpm ops:cms-remote` (scripts/ops/), which is interactive-only and never " +
      "schema-pushes.",
  } = {},
) {
  console.error("");
  console.error("========================================================");
  console.error(` ${title}`);
  console.error("========================================================");
  console.error(message);
  console.error("");
  console.error(footer);
  console.error("========================================================");
  console.error("");
  process.exit(1);
}

if (!databaseUri) {
  fail(
    `Could not find DATABASE_URI (checked process.env and the .env* files in ${CMS_DIR}).`,
  );
}

if (databaseUri.includes("neon.tech")) {
  fail(
    `DATABASE_URI references neon.tech, a real Neon database:\n  ${databaseUri}`,
  );
}

if (!isLocalHostname(hostname)) {
  fail(
    `DATABASE_URI host is "${hostname ?? "(unparseable)"}", not one of ` +
      `localhost/127.0.0.1/::1:\n  ${databaseUri}`,
  );
}

console.log(`assert-local-db: OK (host=${hostname})`);

// --- Port ownership: a local hostname is not proof it's OUR container -----
//
// Find the container id currently bound to a host port (globally, not
// scoped to this project) and compare its
// `com.docker.compose.project.working_dir` label to REPO_ROOT. No container
// on the port at all means the stack simply is not up yet, which is fine
// here (this guard runs before dev/seed start using it, not after).

/**
 * @param {number} hostPort
 * @returns {string | null | undefined} container id, `null` if the port is
 *   free, or `undefined` if `docker` itself could not be queried (in which
 *   case the check is skipped rather than failing the whole guard).
 */
function containerIdOnPort(hostPort) {
  try {
    const out = execFileSync(
      "docker",
      ["ps", "--filter", `publish=${hostPort}`, "--format", "{{.ID}}"],
      { encoding: "utf-8" },
    ).trim();
    return out ? out.split("\n")[0].trim() : null;
  } catch {
    return undefined;
  }
}

/**
 * @param {string} containerId
 * @returns {string | null} the container's compose project working_dir
 *   label, or null if it could not be read (label absent, not a compose
 *   container, permissions, etc).
 */
function composeWorkingDirOf(containerId) {
  try {
    const out = execFileSync(
      "docker",
      [
        "inspect",
        "--format",
        '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}',
        containerId,
      ],
      { encoding: "utf-8" },
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

function assertPortOwnership() {
  const ports = [{ hostPort: portOf(databaseUri, 5433), service: "Postgres" }];

  // Only add the MinIO port check when S3_ENDPOINT is unset (local default)
  // or explicitly local: a deliberately-remote S3_ENDPOINT means "something
  // else happens to be on 9000" is not this guard's business.
  const s3Endpoint = resolvedEnv.S3_ENDPOINT ?? "";
  if (!s3Endpoint || isLocalHostname(hostnameOf(s3Endpoint))) {
    ports.push({ hostPort: portOf(s3Endpoint, 9000), service: "MinIO" });
  }

  for (const { hostPort, service } of ports) {
    const containerId = containerIdOnPort(hostPort);
    if (containerId === undefined) return; // docker CLI unavailable; skip
    if (!containerId) continue; // nothing bound to this port yet; fine

    const workingDir = composeWorkingDirOf(containerId);
    if (workingDir === REPO_ROOT) continue; // it's our own stack

    fail(
      `Port ${hostPort} (${service}) is already answered by a container from ` +
        `a different docker compose project` +
        (workingDir ? ` (${workingDir})` : "") +
        `, not this repo (${REPO_ROOT}).`,
      {
        title: `REFUSING TO CONTINUE: port ${hostPort} belongs to another docker compose project`,
        footer:
          'Another local stack is squatting this port. See "Default loop" ' +
          "in docs/dev/local-development.md for how to reuse or stop that " +
          "other stack before continuing.",
      },
    );
  }
}

assertPortOwnership();
console.log("assert-local-db: port ownership OK");
