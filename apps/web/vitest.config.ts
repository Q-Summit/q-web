import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// Two projects, split by what the code under test needs at import time:
//
//  - "workers": worker/index.ts and the pure library modules (href,
//    lexical-html) run inside the real Workers runtime (workerd, via
//    Miniflare) -- the same engine `wrangler dev` and production use -- so
//    the R2 binding and Cache API behave exactly as they do on the edge (the
//    one place local can't reach is real multi-PoP caching; see AGENTS/DESIGN).
//    This is Cloudflare's officially recommended way to test a Worker
//    (@cloudflare/vitest-pool-workers).
//
//  - "node": src/lib/content (and media-filename) use node:fs / process at
//    module load, which the Workers pool cannot run, so those tests use a
//    plain Node environment. href/lexical-html stay pure so they can remain
//    in the workers project alongside the Worker tests.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: [
            "test/content.test.ts",
            "test/media-filename.test.ts",
            "test/media-match.test.ts",
          ],
          // content.ts resolves CONTENT_SOURCE at module load and now throws
          // on an unset or unrecognized value, so a misconfigured production
          // build fails loudly instead of silently shipping the fake fixture.
          // These tests exercise exactly that fixture, so say so explicitly.
          env: { CONTENT_SOURCE: "json" },
        },
      },
      {
        plugins: [
          cloudflareTest({
            miniflare: {
              // Keep in sync with wrangler.jsonc's compatibility_date. We
              // declare the bindings explicitly here instead of pointing at
              // wrangler.jsonc so the suite stays hermetic: loading
              // wrangler.jsonc would also pull in the static-assets binding,
              // which requires a built ./dist to exist before tests could run.
              compatibilityDate: "2026-07-17",
              // Same local R2 simulation `wrangler dev` uses (Miniflare, in
              // workerd) -- the highest-fidelity R2 replica available off the
              // edge.
              r2Buckets: ["MEDIA"],
              // The Worker only calls env.ASSETS.fetch() for non-/media/*
              // requests. A tiny service-binding fetcher stands in for the
              // static-assets binding so the passthrough path is testable
              // without building dist.
              serviceBindings: {
                ASSETS(request) {
                  return new Response(`asset:${new URL(request.url).pathname}`);
                },
              },
            },
          }),
        ],
        test: {
          name: "workers",
          include: ["test/**/*.test.ts"],
          exclude: [
            "test/content.test.ts",
            "test/media-filename.test.ts",
            "test/media-match.test.ts",
          ],
        },
      },
    ],
  },
});
