/**
 * Fixed `/media/*` assets of the Q-Hack x Hacktoberfest page. Like every
 * other `/media/*` file they live on R2 (local: gitignored public/media),
 * never in git. Each one is a Media library upload in the CMS under exactly
 * this filename (Payload stores uploads at the bucket root, so the keys are
 * flat); see the comments for the source of each.
 */

/**
 * White Q-Hack lockup ("Q-hack, University of Mannheim") on transparent
 * ground, 960x312. Extracted unchanged from the alpha channel of the
 * official Hack-Logo-weiss.pdf (Q-Hack CI package).
 */
export const qHackLogoWhite = {
  src: "/media/q-hack-logo-white.webp",
  width: 960,
  height: 312,
} as const;

/**
 * Official Hacktoberfest 2026 horizontal logo, white colorway, unmodified
 * download from hacktoberfest.com/brand
 * (brand/logos/hacktoberfest-2026-horizontal-white.svg). Brand rules: no
 * recoloring or effects, clear space of at least the H height.
 */
export const hacktoberfestLogoWhite = {
  src: "/media/hacktoberfest-2026-horizontal-white.svg",
  width: 2243,
  height: 215,
} as const;

/**
 * Width ladder of every look-back photo, same `-p-<width>` suffix scheme
 * as the other sized R2 photos (lib/team-media.ts). Real WebP, encoded
 * from the originals with sharp (quality 72 at 1024 and 1536, 70 below,
 * effort 6, smart subsampling); all share the 3:2 originals' ratio.
 */
export const PHOTO_WIDTHS = [480, 768, 1024, 1536] as const;
export type PhotoWidth = (typeof PHOTO_WIDTHS)[number];

export interface PastPhoto {
  /** Base key under /media, without the `-p-<width>.webp` suffix. */
  key: string;
  /** Intrinsic ratio of every variant (3:2). */
  width: number;
  height: number;
  alt: string;
  /** Short caption shown on the photo. */
  caption: string;
  /** CSS object-position for deliberate crops. */
  focus: string;
  /** Average colors of the top and bottom half: the frame's placeholder
   * while the photo loads (colors only, no image data in git). */
  tint: readonly [string, string];
}

/** URL of one width variant. */
export const photoUrl = (photo: PastPhoto, width: PhotoWidth): string =>
  `/media/${photo.key}-p-${width}.webp`;

/** `srcset` over the whole width ladder. */
export const photoSrcset = (photo: PastPhoto): string =>
  PHOTO_WIDTHS.map((w) => `${photoUrl(photo, w)} ${w}w`).join(", ");

const photo = (
  name: string,
  alt: string,
  caption: string,
  focus: string,
  tint: readonly [string, string],
): PastPhoto => ({
  key: name,
  width: 1536,
  height: 1024,
  alt,
  caption,
  focus,
  tint,
});

/**
 * Photos from earlier Q-Hack and Q-Summit events (event photo set 38688 to
 * 38730). Always shown as retrospective, never as pictures of the upcoming
 * Hack Day.
 */
export const pastPhotos = {
  hallProjection: photo(
    "q-hack-hall-projection",
    "Participants at their tables in the university hall, the Q-Hack logo projected on the wall",
    "The hacking hall",
    "40% 60%",
    ["#925da4", "#361c70"],
  ),
  hallOverview: photo(
    "q-hack-hall-overview",
    "Overview of the hacking hall with teams at their laptops under violet light",
    "Teams at work",
    "50% 55%",
    ["#87509c", "#4c3356"],
  ),
  prizeConfetti: photo(
    "q-hack-prize-confetti",
    "Winning team on stage under falling confetti at the hackathon pitch battle",
    "Pitch battle winners",
    "50% 45%",
    ["#2065b1", "#33405a"],
  ),
  laptopWork: photo(
    "q-hack-laptop-work",
    "Two participants working on a laptop and a phone in a lounge corner",
    "Heads down, building",
    "62% 45%",
    ["#631931", "#2c1721"],
  ),
  audience: photo(
    "q-hack-audience",
    "Audience in a dark hall watching the stage",
    "Full house at the finals",
    "50% 40%",
    ["#3d3c60", "#533a48"],
  ),
} as const;
