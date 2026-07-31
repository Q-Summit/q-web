// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static output only: the site deploys as prebuilt files to Cloudflare
// (ADR-0001). Content comes from JSON at build time (src/lib/content.ts);
// there is no server runtime.
export default defineConfig({
  site: "https://q-summit.com",
  output: "static",
  // Visual-regression builds (VRT=1) emit to a separate dir and include the
  // /vrt/ component gallery (src/pages/vrt/, getStaticPaths gated on VRT).
  // Prod builds keep the default dist/ and never contain the gallery, so the
  // gallery cannot ship to visitors and the two builds never share an outDir.
  outDir: process.env.VRT === "1" ? "dist-vrt" : "dist",
  // Directory build format already serves every route trailing-slashed
  // (/program/index.html); pin trailingSlash so dev/preview and the emitted
  // canonical/OG URLs cannot drift from the sitemap's trailing-slash form.
  trailingSlash: "always",
  // First-party Astro integration (no new vendor, build-time only, no
  // runtime/cookies/third-party fetch): emits sitemap-index.xml +
  // sitemap-0.xml covering every static route from `site` above. robots.txt
  // (public/robots.txt) points its `Sitemap:` line at sitemap-index.xml, so
  // renaming or filtering this output must update that line too.
  integrations: [sitemap()],
  // Enables the prefetch infrastructure (the data-astro-prefetch attribute)
  // site-wide; Nav.astro opts its links in explicitly (see its
  // data-astro-prefetch="hover" attribute) rather than prefetchAll, which
  // would also prefetch every footer/card link on all 84 routes.
  prefetch: true,
  // Astro's built-in Fonts API (stable since 6.0.0, not experimental),
  // replacing the hand-rolled preload + metric-matched-fallback CSS that
  // used to live in Base.astro/global.css. `local()` reads the woff2 file
  // straight out of the already-installed @fontsource-variable/montserrat
  // package (a package-import src, no new dependency, no third-party CDN
  // fetch at build time -- unlike fontProviders.fontsource(), which would
  // hit api.fontsource.org/cdn.jsdelivr.net during every build). Astro
  // auto-generates the size-adjust/ascent-override/descent-override
  // metric-matched fallback (optimizedFallbacks, on by default) that was
  // previously computed by hand from a fonttools dump; see Base.astro/
  // tokens.css for how the resulting --font-montserrat variable is wired in.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Montserrat Variable",
      cssVariable: "--font-montserrat",
      fallbacks: ["Arial", "Helvetica Neue", "Helvetica", "sans-serif"],
      options: {
        variants: [
          {
            weight: "100 900",
            style: "normal",
            src: [
              "@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2",
            ],
          },
        ],
      },
    },
  ],
});
