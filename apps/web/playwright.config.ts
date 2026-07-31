import { defineConfig, devices } from "@playwright/test";

// Visual regression config. Screenshots the /vrt/ component gallery served from
// the BUILT static site (VRT=1 astro build -> dist-vrt, served by astro
// preview), never the dev server: a dev server's HMR makes the first paint after
// an edit non-deterministic. Baselines are committed PNGs under
// tests/visual/__screenshots__/. See docs/dev/visual-testing.md.
const PORT = 4331;

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    // html is the review surface (published to Cloudflare Pages / uploaded as a
    // CI artifact); list prints per-test results to the CI log. In CI a json
    // report is also written for scripts/check/vrt-report.mjs, which turns it
    // into the sticky PR comment and (in AUTO mode) stages the new baselines.
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ...(process.env.CI
      ? [["json", { outputFile: "vrt-results.json" }] as const]
      : []),
    ["list"],
  ],
  timeout: 30_000,
  expect: {
    // A flat 200-pixel floor absorbs the few anti-aliased edge pixels that can
    // differ even in the pinned environment, while still catching any real
    // change. maxDiffPixelRatio is intentionally omitted: when both are set
    // Playwright uses min(maxDiffPixels, ratio * totalPixels), so on full-page
    // shots the ratio never binds and only this floor would be in effect
    // anyway. Baselines are generated in the pinned Playwright noble image and
    // verified on the CI ubuntu-24.04 runner (same noble base, same pinned
    // Chromium), so the tolerance stays tight; loosen per-assertion only if a
    // specific shot proves noisy. The way to make the two environments
    // identical is the `Update visual baselines` workflow, which regenerates on
    // the CI runner itself.
    toHaveScreenshot: {
      maxDiffPixels: 200,
      animations: "disabled",
      scale: "css",
    },
  },
  snapshotPathTemplate: "tests/visual/__screenshots__/{arg}{ext}",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: "visual", use: { ...devices["Desktop Chrome"] } }],
  // Serve the VRT build. The `vrt` npm scripts build dist-vrt first; in CI the
  // check builds then runs this. reuseExistingServer speeds local reruns.
  webServer: {
    command: `VRT=1 pnpm exec astro preview --port ${PORT}`,
    // Readiness probe: the homepage is always in the build. The gallery pages
    // it screenshots live at /vrt/<id>/.
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
