// "hls.js/light" (src/components/home/Hero.astro) is a real subpath export
// (see node_modules/hls.js/package.json's "exports" map, and its own
// dist/hls.light.mjs) but ships no type declarations of its own -- only the
// package root ("hls.js") has a "types" condition. The light bundle's public
// API (default export, Events, error types) is identical to the full
// bundle; it only omits internal controllers we never call into directly
// (subtitles, EME/DRM, CMCD, content steering), none of which change the
// shape of anything this component touches. Re-pointing its types at the
// full package's declarations is accurate for that surface and lets
// `astro check` resolve the import without shipping the larger bundle.
declare module "hls.js/light" {
  export * from "hls.js";
  export { default } from "hls.js";
}
