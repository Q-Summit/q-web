/**
 * /speaker page model shared by the page (pages/speaker.astro) and the LLM
 * corpus (lib/llms.ts), so both show the same edition, the same speakers
 * and the same wording.
 */
import type { Speaker, SpeakerPageContent } from "./content";

/** The edition whose speakers stand on the stage in "edition" mode. */
export const STAGE_EDITION = 2026;

/**
 * Who stands on the stage. "homepage": the speakers the homepage shows (its
 * highlights, then its line-up or the stand-ins), until the next line-up is
 * out. "edition": the STAGE_EDITION speakers with their stage pictures. The
 * one switch for the change-over; the LLM corpus follows it too.
 */
export const STAGE_SOURCE: "homepage" | "edition" = "homepage";

/** The homepage's speaker lists (page-home, previousSpeakers). */
export interface HomeSpeakerLists {
  highlights?: string[];
  standIns?: string[];
  lineup?: { year: number } | null;
}
/** The edition the hot topics and the closing pill announce. */
export const NEXT_EDITION = STAGE_EDITION + 1;

export interface SpeakerPageCopy {
  hotTopicsLabel: string;
  hotTopicsHeading: string;
  hotTopicsIntro: string;
  lineupPill: string;
}

/** The CMS texts, each falling back to the built-in wording when empty. */
export function speakerPageCopy(page: SpeakerPageContent): SpeakerPageCopy {
  return {
    hotTopicsLabel: page.hotTopics?.label ?? `Hot topics ${NEXT_EDITION}`,
    hotTopicsHeading:
      page.hotTopics?.heading ??
      `Three topics set the ${NEXT_EDITION} main stage`,
    hotTopicsIntro:
      page.hotTopics?.intro ??
      `The ${NEXT_EDITION} line-up is announced step by step.`,
    lineupPill: page.lineupPill ?? `Line-up ${NEXT_EDITION} · Coming soon`,
  };
}

/**
 * The stage pictures are "screen look" images: cutouts of the
 * stage photo (components/speaker/stage.jpg, 16:9, on a 2576 x 1449 scale) at x 760-1817,
 * y 152-906, with the speaker projected onto the middle screen. A photo of
 * that shape is laid over the stage where it was cut from; any other photo
 * is fitted into the screen. Without a recorded size (JSON mode) a photo
 * counts as a screen-look image.
 */
export const STAGE_SHOT = { width: 1057, height: 754 };

export function isStageShot(speaker: Speaker): boolean {
  // A stage picture (CMS `stagePhoto`) is made for the stage: without a
  // recorded size (JSON mode) it counts as a cutout. The fallback `photo` is
  // the homepage portrait and only counts as one when its shape says so.
  const own = Boolean(speaker.stagePhotoFilename);
  const w = own ? speaker.stagePhotoWidth : speaker.photoWidth;
  const h = own ? speaker.stagePhotoHeight : speaker.photoHeight;
  if (!w || !h) return own;
  return Math.abs(w / h - STAGE_SHOT.width / STAGE_SHOT.height) < 0.02;
}

/** The picture on the stage: the stage picture, else the homepage photo. */
export function stagePhotoFilename(speaker: Speaker): string {
  return speaker.stagePhotoFilename || speaker.photoFilename;
}

/** "Role · Company", or the role line when there is no company. */
export function stageRole(speaker: Speaker): string {
  return speaker.company
    ? `${speaker.role} · ${speaker.company}`
    : speaker.roleLine || speaker.role;
}

/**
 * The speakers the homepage shows, in its order, looked up by name the way
 * pages/index.astro does: each highlight's "panel" entry first (all "panel"
 * speakers without a list), then the line-up of the homepage's line-up year
 * or, while it has none, the stand-ins (their edition entry first). Names
 * without a published speaker are skipped; each person stands once.
 */
export function homepageStageSpeakers(
  lists: HomeSpeakerLists,
  speakers: Speaker[],
): Speaker[] {
  const byName = (name: string, groups: Speaker["group"][]) =>
    groups
      .map((g) => speakers.find((s) => s.name === name && s.group === g))
      .find(Boolean) ?? speakers.find((s) => s.name === name);
  const highlights = lists.highlights
    ? lists.highlights.flatMap((name) => byName(name, ["panel"]) ?? [])
    : speakers.filter((s) => s.group === "panel");
  const booked = lists.lineup
    ? speakers.filter(
        (s) => s.group === "current" && s.year === lists.lineup?.year,
      )
    : [];
  const lineup =
    booked.length > 0
      ? booked
      : (lists.standIns ?? []).flatMap(
          (name) => byName(name, ["current", "panel"]) ?? [],
        );
  const seen = new Set<string>();
  return [...highlights, ...lineup].filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}

/** Who stands on the stage now (STAGE_SOURCE). */
export function stageSpeakers(
  lists: HomeSpeakerLists,
  speakers: Speaker[],
  source: "homepage" | "edition" = STAGE_SOURCE,
): Speaker[] {
  return source === "homepage"
    ? homepageStageSpeakers(lists, speakers)
    : stageEditionSpeakers(speakers);
}

/** The year the stage names, or none when it mixes editions. */
export function stageEdition(
  source: "homepage" | "edition" = STAGE_SOURCE,
): number | undefined {
  return source === "edition" ? STAGE_EDITION : undefined;
}

/** The heading over the stage speakers in the LLM corpus and the page label. */
export function stageLabel(
  source: "homepage" | "edition" = STAGE_SOURCE,
): string {
  return source === "edition"
    ? `Speakers ${STAGE_EDITION}`
    : "Main stage highlights";
}

/**
 * Everyone of STAGE_EDITION who spoke, current line-up or moved to the
 * highlights since; moderators and homepage panel entries are not speakers
 * on this stage. Keeps the CMS order.
 */
export function stageEditionSpeakers(speakers: Speaker[]): Speaker[] {
  return speakers.filter(
    (s) =>
      s.year === STAGE_EDITION &&
      (s.group === "current" || s.group === "previous"),
  );
}
