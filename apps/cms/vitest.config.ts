import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Unit tests run in plain Node with no database: exported hooks/functions get
// mock arguments. Payload Local API + Postgres integration is not in this
// suite (and not a separate CI job yet); add one before relying on end-to-end
// division access against a real schema.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    server: {
      deps: {
        // payload-oauth2 ships ESM with extensionless relative imports, which
        // Node's native resolver rejects; let Vite transform it instead.
        inline: ["payload-oauth2"],
      },
    },
  },
  resolve: {
    alias: {
      // trigger-deploy imports next/server `after`; tests only need a throw
      // so schedulePublishDeploy uses its local timer fallback.
      "next/server": path.join(dirname, "test/stubs/next-server.ts"),
    },
  },
});
