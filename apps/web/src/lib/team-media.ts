/*
 * Team page media: hero constant + wide srcset helper.
 * Portraits use photoSrc from lib/media-filename.ts.
 */

import { existsSync } from "node:fs";

import { MEDIA_DIR, variant } from "./media-filename";

/**
 * Group photo of the hero on both team pages (the LCP element there). The
 * photo is set in the CMS (Our Team > heroImage); until it is, the hero
 * shows the 2027 photo below. A photo uploaded in the three widths, each
 * under its own name ending in -p-1280, -p-1920 and -p-2560 (pick the
 * 2560 one in the CMS), is served as a srcset, so each screen loads only
 * the size it needs; any other file is served as it is.
 */
export const TEAM_HERO_WIDTHS = [1280, 1920, 2560] as const;

export interface TeamHeroSources {
  src: string;
  srcset: string | undefined;
  width: number;
  height: number;
}

const BUILT_IN_HERO = {
  file: "team-2027-hero-p-2560.webp",
  width: 2560,
  height: 1707,
};

export function teamHeroSources(photo?: {
  file: string;
  width?: number;
  height?: number;
}): TeamHeroSources {
  const hero = photo?.file ? photo : BUILT_IN_HERO;
  const width = hero.width ?? BUILT_IN_HERO.width;
  const height = hero.height ?? BUILT_IN_HERO.height;
  const sized = /^(.*)-p-(\d+)(\.[a-z0-9]+)$/i.exec(hero.file);
  const largest = sized ? Number(sized[2]) : 0;
  const widths = sized ? TEAM_HERO_WIDTHS.filter((w) => w <= largest) : [];
  if (!sized || widths.at(-1) !== largest) {
    return {
      src: `/media/${encodeURIComponent(hero.file)}`,
      srcset: undefined,
      width,
      height,
    };
  }
  const at = (w: number) =>
    `/media/${encodeURIComponent(`${sized[1]}-p-${w}${sized[3]}`)}`;
  return {
    src: at(widths.length > 1 ? widths[widths.length - 2] : largest),
    srcset: widths.map((w) => `${at(w)} ${w}w`).join(", "),
    width,
    height,
  };
}

export interface ResponsivePhoto {
  src: string;
  srcset: string | undefined;
}

/** Wide photo src + optional srcset from local -p-800/-p-1600, else CMS/R2 key. */
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
    // Same rule as resolvePhotoMediaKey: no invented sized keys when R2 only
    // has the original (or an already-sized CMS filename).
    const key = encodeURIComponent(photoFilename);
    return { src: `/media/${key}`, srcset: undefined };
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
