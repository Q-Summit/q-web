/*
 * Shared data-shaping for /our-team and /past-teams. Both pages now render
 * both the current-team divisions grid and the year-by-year history panel
 * (see components/team/TeamPanels.astro): the toggle between them is a
 * client-side visibility swap, not a navigation, so each page needs both
 * datasets built the same way. Factored out here rather than duplicated in
 * both page components (the COMP-3 principle, applied to a data helper).
 */
import type { ImageMetadata } from "astro";
import type { PastTeam, TeamMember } from "./content";
import { widePhotoSrc, type ResponsivePhoto } from "./team-media";
import { resolveContentImage } from "./images";

export interface DivisionGroup {
  division: string;
  members: TeamMember[];
}

// Division order from the live page; unknown divisions are appended at the
// end.
const DIVISION_ORDER = [
  "Chair",
  "Public Relations",
  "Partner",
  "Finance",
  "Operations",
];

export function groupDivisions(team: TeamMember[]): DivisionGroup[] {
  const divisions = [
    ...DIVISION_ORDER,
    ...new Set(
      team
        .map((member) => member.division)
        .filter((division) => !DIVISION_ORDER.includes(division)),
    ),
  ];
  return divisions
    .map((division) => ({
      division,
      members: team.filter((member) => member.division === division),
    }))
    .filter((group) => group.members.length > 0);
}

export interface PastYearEntry {
  year: string;
  photo: ResponsivePhoto;
  /** astro:assets pipeline image, when the source file was migrated (see
   * src/lib/images.ts); components fall back to `photo` (plain /media/ URL)
   * when this is undefined. */
  image: ImageMetadata | undefined;
  size: { width: number; height: number };
}

// Intrinsic dimensions of the mirrored group photos (avoids layout shift);
// unknown files fall back to the common 3:2 shape.
const PHOTO_SIZES: Record<string, { width: number; height: number }> = {
  "68a72b4155f588ad5d98b844_CT2026.webp": { width: 1600, height: 1066 },
  "69629477ecf1b347f8bca58e_jpgpngtools_compressed_Q25.webp": {
    width: 1600,
    height: 900,
  },
  "6962945483b029ac332fd2df_jpgpngtools_compressed_Q24.webp": {
    width: 1600,
    height: 1067,
  },
  "69767ccf5826b3a06e6ec533_Q23.webp": { width: 1600, height: 1200 },
};

// CMS mode can resolve a photoFilename to an already "-p-<size>"-suffixed
// variant (see lib/team-media.ts); JSON mode's photoFilename is
// always the clean base name. Strip any such suffix before keying into
// PHOTO_SIZES above so both modes hit the same intrinsic-dimensions entry.
function baseKey(photoFilename: string): string {
  return photoFilename.replace(/-p-\d+(?=\.[a-zA-Z0-9]+$)/, "");
}

export async function groupPastYears(
  pastTeams: PastTeam[],
): Promise<PastYearEntry[]> {
  const entries = [...pastTeams].sort((a, b) => b.year.localeCompare(a.year));
  return Promise.all(
    entries.map(async (entry) => ({
      year: entry.year,
      photo: widePhotoSrc(entry.photoFilename),
      image: await resolveContentImage(
        entry.photoFilename,
        `past-team year ${entry.year}`,
      ),
      size: PHOTO_SIZES[baseKey(entry.photoFilename)] ?? {
        width: 1600,
        height: 1067,
      },
    })),
  );
}
