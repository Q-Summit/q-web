/*
 * Image resolution for the Why Q audience sections, shared by /whyq/ (every
 * audience on one page) and the audience pages under /whyq/<audience>/.
 * Both render components/whyq/FeatureSection.astro, which takes the
 * FeatureImage built here.
 */
import type { FeatureImage } from "../components/whyq/FeatureSection.astro";
import { resolveContentImage } from "./images";

// Asset dimensions/extension are a technical fact about the image file, not
// editorial content, so they stay code-side keyed by the content layer's
// imageFile field rather than living in page-content.json.
const WHYQ_IMAGE_ASSETS: Record<
  string,
  { ext: "webp" | "jpg"; width: number; height: number }
> = {
  "whyq-attendees": { ext: "webp", width: 800, height: 533 },
  "whyq-startups": { ext: "webp", width: 800, height: 533 },
  "whyq-investors": { ext: "webp", width: 800, height: 534 },
  "whyq-partners": { ext: "jpg", width: 800, height: 641 },
  "whyq-founders": { ext: "webp", width: 800, height: 632 },
};

/**
 * Fallback for an imageFile with no registry entry.
 *
 * This used to throw, which meant a content-only edit -- swapping a /whyq
 * audience photo, or adding a sixth audience -- failed `astro build` and so
 * blocked every subsequent deploy of the whole site, with no way for the
 * editor to recover without a code change. The registry only supplies
 * intrinsic dimensions, so the graceful outcome is to render the plain
 * /media/ image without the pipeline's responsive variants. 4:3 is the shape
 * every registered entry is within a few percent of, and it only sets the
 * aspect box that reserves layout space.
 */
const WHYQ_IMAGE_FALLBACK = { ext: "webp", width: 800, height: 600 } as const;

/** The FeatureSection image for one audience's `imageFile` / `imageAlt`. */
export async function resolveWhyqImage(
  imageFile: string,
  alt: string,
): Promise<FeatureImage> {
  const registered = WHYQ_IMAGE_ASSETS[imageFile];
  if (!registered) {
    console.warn(
      `[whyq] no asset dimensions registered for "${imageFile}"; rendering it without ` +
        `responsive variants. Add it to WHYQ_IMAGE_ASSETS in src/lib/whyq-images.ts.`,
    );
  }
  const asset = registered ?? WHYQ_IMAGE_FALLBACK;
  const pipelineImage = await resolveContentImage(
    `${imageFile}.${asset.ext}`,
    `whyq audience ${imageFile}`,
  );
  return {
    base: `/media/${imageFile}`,
    ext: asset.ext,
    width: asset.width,
    height: asset.height,
    alt,
    asset: pipelineImage,
  };
}
