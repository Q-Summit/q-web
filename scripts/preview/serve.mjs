/**
 * Start a Cloudflare-shaped local preview (wrangler + assets + R2 Worker).
 * Shared by interactive `preview:cf` and the Lighthouse CF loop.
 */
import { spawn } from "node:child_process";
import http from "node:http";

import { WEB_DIR } from "../lib/paths.mjs";
import { findFreePort } from "../lib/ports.mjs";

/**
 * Wait until an HTTP GET to url succeeds (any status).
 * @param {string} url
 * @param {{ attempts?: number, delayMs?: number }} [opts]
 */
export function waitForHttp(url, { attempts = 90, delayMs = 500 } = {}) {
  return new Promise((resolve, reject) => {
    let left = attempts;
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on("error", () => {
        left -= 1;
        if (left <= 0) {
          reject(new Error(`server not ready at ${url}`));
          return;
        }
        setTimeout(tick, delayMs);
      });
    };
    tick();
  });
}

/**
 * @param {{ port?: number, startPort?: number }} [opts]
 * @returns {Promise<{ port: number, baseUrl: string, stop: () => void, log: () => string }>}
 */
export async function startWranglerDev(opts = {}) {
  const port = opts.port ?? (await findFreePort(opts.startPort ?? 8787, 20));
  const baseUrl = `http://127.0.0.1:${port}/`;

  const child = spawn(
    "pnpm",
    [
      "exec",
      "wrangler",
      "dev",
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: WEB_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    },
  );

  let log = "";
  child.stdout.on("data", (chunk) => {
    log += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    log += chunk.toString();
  });

  const stop = () => {
    if (!child.killed) child.kill("SIGTERM");
  };

  try {
    await waitForHttp(baseUrl);
  } catch (err) {
    stop();
    const detail = log.trim() ? `\n${log.trim()}` : "";
    throw new Error(`${err instanceof Error ? err.message : err}${detail}`);
  }

  return {
    port,
    baseUrl,
    stop,
    log: () => log,
  };
}

/**
 * @param {{ port?: number, startPort?: number }} [opts]
 */
export async function startAstroPreview(opts = {}) {
  const port = opts.port ?? (await findFreePort(opts.startPort ?? 4325, 20));
  const baseUrl = `http://127.0.0.1:${port}/`;

  const child = spawn(
    "pnpm",
    ["exec", "astro", "preview", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: WEB_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    },
  );

  let log = "";
  child.stdout.on("data", (chunk) => {
    log += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    log += chunk.toString();
  });

  const stop = () => {
    if (!child.killed) child.kill("SIGTERM");
  };

  try {
    await waitForHttp(baseUrl);
  } catch (err) {
    stop();
    const detail = log.trim() ? `\n${log.trim()}` : "";
    throw new Error(`${err instanceof Error ? err.message : err}${detail}`);
  }

  return { port, baseUrl, stop, log: () => log };
}
