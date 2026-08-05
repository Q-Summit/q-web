/*
 * astro:assets resolver for CMS/JSON-driven content images.
 *
 * Some content images (speaker/team photos, whyq audience shots, partner
 * testimonial portraits) are keyed by a filename that comes from the content
 * layer (src/lib/content.ts) at build time, not a static import path a
 * component can hard-code -- the actual file differs per speaker/member/
 * testimonial. This resolves such a filename to the imported ImageMetadata
 * of whichever optional local file sits under gitignored
 * src/assets/media/ (see apps/web/AGENTS.md), so components can render it
 * through <Image>/<Picture> when present. Prod/CI usually have an empty
 * tree and fall back to a plain <img src="/media/..."> from R2.
 *
 * Fixed paths (logo, program/hackathon section photos) are string
 * constants in src/assets/media/*.ts pointing at `/media/...`, not
 * committed binaries.
 *
 * Matching rules live in media-match.ts (shared with content/media.ts).
 */
import type { ImageMetadata } from "astro";

import { isFixtureMediaSentinel } from "./media-filename";
import { matchMediaFilename } from "./media-match";

type ImageLoader = () => Promise<{ default: ImageMetadata }>;

// eager: false -- these are resolved lazily, one filename at a time, from
// async content getters; nothing here needs every asset loaded up front.
//
// The extension list matters: src/assets/media/ also holds the committed
// *.ts path barrels (brand.ts, hackathon.ts, program.ts), and a bare "*" glob
// indexed those as if they were images. They could then win the loose
// normalized match below and be handed to <Image> as ImageMetadata.
const mediaGlob = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/media/*.{avif,webp,png,jpg,jpeg,svg}",
  { eager: false },
);

interface AssetIndex {
  loaders: Map<string, ImageLoader>;
  basenames: string[];
}

let indexCache: AssetIndex | null = null;

function buildIndex(): AssetIndex {
  const loaders = new Map<string, ImageLoader>();
  for (const [path, loader] of Object.entries(mediaGlob)) {
    const basename = path.split("/").pop();
    if (basename) loaders.set(basename, loader as ImageLoader);
  }
  return { loaders, basenames: [...loaders.keys()] };
}

function getIndex(): AssetIndex {
  if (!indexCache) indexCache = buildIndex();
  return indexCache;
}

/**
 * Resolve a content-layer filename to its migrated astro:assets
 * ImageMetadata, or undefined (with a console warning) when no matching
 * asset was migrated to src/assets/media/.
 *
 * Pass `{ quiet: true }` for optional fixed paths (e.g. WhyCards) where a
 * miss against a non-empty local tree is expected until `pnpm picture:sync`
 * -- otherwise the fixture gate treats the warn as a real mismatch.
 */
export async function resolveContentImage(
  filename: string,
  label: string,
  options: { quiet?: boolean } = {},
): Promise<ImageMetadata | undefined> {
  if (!filename || isFixtureMediaSentinel(filename)) return undefined;
  const index = getIndex();

  // No local binaries at all: the documented CI and production state, since
  // src/assets/media/* is gitignored (apps/web/AGENTS.md). Every caller
  // already falls back to a plain /media/... <img> served from R2, so warning
  // once per image here would print dozens of lines describing normal
  // operation -- and that noise is what let 24 genuine partner-band misses sit
  // unnoticed in the same build output. Stay silent; a MISS against a
  // NON-EMPTY index below is still a real signal and still warns.
  if (index.loaders.size === 0) return undefined;

  const match = matchMediaFilename(filename, index.basenames);
  if (!match) {
    if (!options.quiet) {
      console.warn(
        `[images] no pipeline asset found for ${label}: ${filename}`,
      );
    }
    return undefined;
  }

  // Optional fixed paths: miss is fine; do not fuzzy-match a different photo.
  if (options.quiet && match.kind === "substring") return undefined;

  if (match.kind === "substring") {
    // Last-resort substring match can return a DIFFERENT image (partner band
    // hazard: "jonas1" contains "jonas"). Say so out loud.
    console.warn(
      `[images] ${label}: "${filename}" matched "${match.file}" only by loose substring; ` +
        "verify it is the intended image and rename the asset if not",
    );
  }

  const loader = index.loaders.get(match.file);
  return loader ? (await loader()).default : undefined;
}
