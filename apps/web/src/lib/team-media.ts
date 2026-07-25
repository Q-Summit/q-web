/*
 * Team page media: hero constant + wide srcset helper.
 * Portraits use photoSrc from lib/media-filename.ts.
 */

import { existsSync } from "node:fs";

import {
  MEDIA_DIR,
  sanitize,
  variant,
} from "./media-filename";

/**
 * Group-photo LCP asset. Named `-p-1600` on purpose: R2 has no unsuffixed
 * original. Keep in sync with contact-legal/ReachOut.astro srcset.
 */
export const TEAM_HERO_PHOTO = "6a3aa1fe255b386868d8b214_Q2027-CT-p-1600.jpg";

export interface ResponsivePhoto {
  src: string;
  srcset: string | undefined;
}

/** Wide photo src + optional srcset from local -p-800/-p-1600, or optimistic R2 keys. */
export function widePhotoSrc(photoFilename: string): ResponsivePhoto {
  const sources: { url: string; width: number }[] = [];
  for (const [suffix, width] of [
    ["-p-800", 800],
    ["-p-1600", 1600],
  ] as const) {
    const candidate = variant(photoFilename, suffix);
    if (existsSync(`${MEDIA_DIR}${candidate}`)) {
      sources.push({ url: `/media/${candidate}`, width });
    }
  }
  if (sources.length === 0) {
    const cleaned = sanitize(photoFilename);
    if (/-p-\d+\./.test(cleaned)) {
      return { src: `/media/${cleaned}`, srcset: undefined };
    }
    const p800 = variant(photoFilename, "-p-800");
    const p1600 = variant(photoFilename, "-p-1600");
    return {
      src: `/media/${p1600}`,
      srcset: `/media/${p800} 800w, /media/${p1600} 1600w`,
    };
  }
  const largest = sources[sources.length - 1];
  return {
    src: largest.url,
    srcset:
      sources.length > 1
        ? sources.map((s) => `${s.url} ${s.width}w`).join(", ")
        : undefined,
  };
}
