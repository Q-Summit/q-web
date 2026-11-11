// @ts-check
import { writeFile } from "node:fs/promises";

import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

/**
 * Writes the `redirects` map below to dist/_redirects, so production answers
 * each one with a real HTTP redirect.
 *
 * Why two layers. Astro's `redirects` alone is not enough for a static site:
 * the dev server answers with a real 3xx, but the build can only emit an
 * HTML page with a meta refresh (status 200), which is not a redirect to a
 * crawler or a link checker. Cloudflare's static asset layer reads
 * `_redirects` from the asset directory and applies it before it looks for a
 * file, so the rule wins over that fallback page and needs no Worker code
 * (the Worker only sees /media/* and /qm/*, wrangler.jsonc). Astro's own
 * Cloudflare adapter derives the same file from the same map; the site has
 * no adapter (static output, ADR-0001), hence these few lines. One map, so
 * dev, the static fallback and production cannot drift apart.
 *
 * `_redirects` matches a static source by exact path, so each source is
 * written with and without its trailing slash. Only static sources are
 * supported; a pattern fails the build instead of shipping a rule that
 * silently never matches.
 *
 * @returns {import("astro").AstroIntegration}
 */
function cloudflareRedirects() {
  /** @type {import("astro").AstroConfig["redirects"]} */
  let redirects = {};
  return {
    name: "q-web:cloudflare-redirects",
    hooks: {
      "astro:config:done": ({ config }) => {
        redirects = config.redirects;
      },
      "astro:build:done": async ({ dir }) => {
        const lines = Object.entries(redirects).flatMap(([from, to]) => {
          if (/[[\]*:]/.test(from)) {
            throw new Error(
              `astro.config.mjs redirects: "${from}" is a pattern; only static paths are written to _redirects.`,
            );
          }
          const destination = typeof to === "string" ? to : to.destination;
          const status = typeof to === "string" ? 301 : to.status;
          const source = from.replace(/\/+$/, "");
          return [
            `${source} ${destination} ${status}`,
            `${source}/ ${destination} ${status}`,
          ];
        });
        if (lines.length === 0) return;
        await writeFile(new URL("_redirects", dir), `${lines.join("\n")}\n`);
      },
    },
  };
}

// Static output only: the site deploys as prebuilt files to Cloudflare
// (ADR-0001). Content comes from JSON at build time (src/lib/content.ts);
// there is no server runtime.
export default defineConfig({
  site: "https://q-summit.com",
  output: "static",
  // Routes that are offline or have moved (docs/architecture/08-concepts.md:
  // a published URL never goes dead). A redirect here replaces the page file
  // of the same route, which may stay in src/pages/ untouched.
  //
  // /program/ is offline until the 2027 program is ready: visitors land on
  // the homepage. 302, not 301, because the page comes back; a permanent
  // redirect would stay cached in browsers and search indexes after it does.
  // To bring the page back, delete this entry (pages/program.astro, its
  // components and the page-program content are all still in place) and
  // list the route again in lib/llms.ts and the navigation.
  //
  // /whyq/ was the overview of all audiences. "Why Q?" is now the four
  // audience pages under it (pages/whyq/[audience].astro), reached from
  // the header's submenu, so the old address leads to the place where a
  // visitor picks an audience: the tiles on the homepage. 302, because the
  // audience pages are still provisional and the best target may change.
  // (The dev server answers this one with 301: Astro honors `status` only
  // when the destination is itself a route, and "/#why-attend" carries a
  // fragment. Production takes the status from _redirects, written above.)
  redirects: {
    "/program": { status: 302, destination: "/" },
    "/whyq": { status: 302, destination: "/#why-attend" },
  },
  // Visual-regression builds (VRT=1) emit to a separate dir and include the
  // /vrt/ component gallery (src/pages/vrt/, getStaticPaths gated on VRT).
  // Prod builds keep the default dist/ and never contain the gallery, so the
  // gallery cannot ship to visitors and the two builds never share an outDir.
  outDir: process.env.VRT === "1" ? "dist-vrt" : "dist",
  // Directory build format already serves every route trailing-slashed
  // (/speaker/index.html); pin trailingSlash so dev/preview and the emitted
  // canonical/OG URLs cannot drift from the sitemap's trailing-slash form.
  trailingSlash: "always",
  // First-party Astro integration (no new vendor, build-time only, no
  // runtime/cookies/third-party fetch): emits sitemap-index.xml +
  // sitemap-0.xml covering every static route from `site` above. robots.txt
  // (public/robots.txt) points its `Sitemap:` line at sitemap-index.xml, so
  // renaming or filtering this output must update that line too. Redirected
  // routes (`redirects` above) are not pages, so the sitemap leaves them out.
  integrations: [sitemap(), cloudflareRedirects()],
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
