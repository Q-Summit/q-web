/** Shared free-port helpers for local preview / Lighthouse servers. */

import net from "node:net";

export function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

/**
 * @param {number} start
 * @param {number} span
 * @returns {Promise<number>}
 */
export async function findFreePort(start, span) {
  for (let port = start; port < start + span; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`no free port found in range ${start}-${start + span - 1}`);
}
