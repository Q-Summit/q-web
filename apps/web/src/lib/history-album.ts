/*
 * The album of the team history story (DESIGN.md HISTORY-1): one photo per
 * board year from the Past Teams list, oldest first, plus the current team's
 * hero photo as the newest year. Built at build time for both team routes,
 * since each renders the story (the Current Team / History switch swaps the
 * two views in place).
 */

import { getImage } from "./astro-assets";
import type { PastYearEntry } from "./team";
import type { TeamHeroSources } from "./team-media";

export interface HistoryTeam {
  /** "Q23" */
  label: string;
  /** 2023 */
  year: number;
  /** A screen-sized image for the album (about 1300 px wide). */
  src: string;
  srcset?: string;
  width: number;
  height: number;
  alt: string;
}

// "22/23" is the board that ran Q-Summit 2023 (Q23).
const yearOf = (board: string) => 2000 + Number(board.split("/")[1]);

export async function buildHistoryAlbum(
  pastYears: PastYearEntry[],
  hero: TeamHeroSources,
  photoAlt = "The Q-Summit team of {year}",
): Promise<HistoryTeam[]> {
  const altFor = (year: number) => photoAlt.replaceAll("{year}", String(year));
  const album: HistoryTeam[] = [];
  for (const entry of [...pastYears].reverse()) {
    const year = yearOf(entry.year);
    if (!Number.isFinite(year)) continue;
    // A screen-sized picture for the camera's screen (it is drawn into the
    // 3D screen too, so one size serves both).
    const src = entry.image
      ? (await getImage({ src: entry.image, width: 1400, format: "webp" })).src
      : entry.photo.src;
    album.push({
      label: `Q${String(year).slice(2)}`,
      year,
      src,
      srcset: entry.image ? undefined : entry.photo.srcset,
      width: entry.size.width,
      height: entry.size.height,
      alt: altFor(year),
    });
  }
  // the current team, the newest picture of the album
  const latest = album.at(-1)?.year ?? new Date().getFullYear();
  album.push({
    label: `Q${String(latest + 1).slice(2)}`,
    year: latest + 1,
    src: hero.src,
    srcset: hero.srcset,
    width: hero.width,
    height: hero.height,
    alt: altFor(latest + 1),
  });
  return album;
}
