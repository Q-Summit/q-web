/**
 * Speakers collection + edition helpers.
 */
import { fetchPublishedDocs, memoizeCms, stableOrderCompare } from "./cms";
import {
  resolveOptionalUploadFilename,
  uploadDimensions,
  type CmsMediaRef,
} from "./media";
import { CONTENT_SOURCE, readJson } from "./source";

export type SpeakerGroup = "current" | "moderation" | "panel" | "previous";

export interface Speaker {
  name: string;
  role: string;
  company: string | null;
  /** Full role line exactly as the live site renders it, e.g.
   * "Co-Founder of SumUp" or "Director DACH & EMEA @Facebook" (not always
   * "role, company"). */
  roleLine: string;
  photoFilename: string;
  group: SpeakerGroup;
  /** Conference edition. Null for highlights whose edition is unknown. */
  year: number | null;
  /** Verbatim bio paragraph; only the main-stage-homepage highlights have
   * one (the live homepage carousel is the only place bios are shown). */
  bio?: string;
  /** Intrinsic photo size, when the CMS recorded it (not in JSON mode). */
  photoWidth?: number;
  photoHeight?: number;
  /** Picture for the /speaker stage only (CMS `stagePhoto`); the homepage
   * keeps `photoFilename`. */
  stagePhotoFilename?: string;
  stagePhotoWidth?: number;
  stagePhotoHeight?: number;
  /** Talk title, shown on the /speaker stage. */
  talkTitle?: string;
  /** One sentence from the talk, without quotation marks. */
  quote?: string;
}

// The CMS `group` select passes straight through: the exported union mirrors
// it 1:1, so no mapping (and no year interpolation) is needed. An unknown
// value still degrades to "previous" rather than breaking the build.
function toSpeakerGroup(group: string): SpeakerGroup {
  switch (group) {
    case "current":
    case "moderation":
    case "panel":
    case "previous":
      return group;
    default:
      console.warn(`[content:cms] unmapped speaker group "${group}"`);
      return "previous";
  }
}

interface CmsSpeakerDoc {
  id: number | string;
  name: string;
  role: string;
  company?: string | null;
  /** Falls back to "role, company" (or plain "role") when absent, same as
   * the pre-roleLine port did unconditionally. */
  roleLine?: string | null;
  bio?: string | null;
  talkTitle?: string | null;
  quote?: string | null;
  photo: CmsMediaRef | number | string | null;
  stagePhoto?: CmsMediaRef | number | string | null;
  group: string;
  year?: number | null;
  order?: number | null;
}

async function cmsGetSpeakers(): Promise<Speaker[]> {
  const docs = await fetchPublishedDocs<CmsSpeakerDoc>("speakers");
  docs.sort(stableOrderCompare);
  const speakers: Speaker[] = [];
  for (const doc of docs) {
    const roleLine =
      doc.roleLine?.trim() ||
      (doc.company ? `${doc.role}, ${doc.company}` : doc.role);
    speakers.push({
      name: doc.name,
      role: doc.role,
      company: doc.company ?? null,
      roleLine,
      photoFilename: await resolveOptionalUploadFilename(
        doc.photo,
        `speaker ${doc.name}`,
      ),
      group: toSpeakerGroup(doc.group),
      year: doc.year ?? null,
      ...(doc.bio?.trim() ? { bio: doc.bio.trim() } : {}),
      ...(() => {
        const size = uploadDimensions(doc.photo);
        return size ? { photoWidth: size.width, photoHeight: size.height } : {};
      })(),
      ...(await (async () => {
        const filename = await resolveOptionalUploadFilename(
          doc.stagePhoto,
          `speaker ${doc.name} stage photo`,
        );
        if (!filename) return {};
        const size = uploadDimensions(doc.stagePhoto);
        return {
          stagePhotoFilename: filename,
          ...(size
            ? { stagePhotoWidth: size.width, stagePhotoHeight: size.height }
            : {}),
        };
      })()),
      ...(doc.talkTitle?.trim() ? { talkTitle: doc.talkTitle.trim() } : {}),
      ...(doc.quote?.trim() ? { quote: doc.quote.trim() } : {}),
    });
  }
  return speakers;
}

/**
 * The edition /speaker should show: the newest year among published
 * current-edition speakers, or null when none carry a year.
 *
 * Derived rather than configured so that publishing next year's lineup is all
 * an editor has to do. Nothing needs a code change at edition rollover.
 */
export function currentSpeakerEdition(speakers: Speaker[]): number | null {
  const years = speakers
    .filter((s) => s.group === "current" || s.group === "moderation")
    .map((s) => s.year)
    .filter((y): y is number => typeof y === "number");
  return years.length > 0 ? Math.max(...years) : null;
}

/** Speakers in `group` belonging to `year` (or all of them when year is null). */
export function speakersForEdition(
  speakers: Speaker[],
  group: SpeakerGroup,
  year: number | null,
): Speaker[] {
  return speakers.filter(
    (s) => s.group === group && (year === null || s.year === year),
  );
}

export function getSpeakers(): Promise<Speaker[]> {
  return CONTENT_SOURCE === "cms"
    ? memoizeCms("speakers", cmsGetSpeakers)
    : readJson<Speaker[]>("speakers.json");
}
