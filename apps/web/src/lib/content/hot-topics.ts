/**
 * Hot topics collection: the sphere cards at the top of /speaker.
 */
import { fetchPublishedDocs, memoizeCms, stableOrderCompare } from "./cms";
import {
  resolveOptionalUploadFilename,
  resolveUploadFilename,
  type CmsMediaRef,
} from "./media";
import { CONTENT_SOURCE, readJson } from "./source";

export interface HotTopic {
  /** One word, set very large, e.g. "SPACE". */
  keyword: string;
  title: string;
  /** The industries the topic covers. */
  field: string;
  description: string;
  /** The sphere (square, transparent), under /media/. */
  imageFilename: string;
  /** Alt text of the sphere, from the media library. */
  imageAlt: string;
  /** Plainer sphere for the small round button; falls back to the image. */
  thumbFilename?: string;
}

interface CmsHotTopicDoc {
  keyword: string;
  title: string;
  field: string;
  description: string;
  image: (CmsMediaRef & { alt?: string | null }) | number | string | null;
  thumb?: CmsMediaRef | number | string | null;
  order?: number | null;
}

async function cmsGetHotTopics(): Promise<HotTopic[]> {
  const docs = await fetchPublishedDocs<CmsHotTopicDoc>("hot-topics");
  docs.sort(stableOrderCompare);
  const topics: HotTopic[] = [];
  for (const doc of docs) {
    const label = `hot topic ${doc.keyword}`;
    const thumbFilename = await resolveOptionalUploadFilename(doc.thumb, label);
    topics.push({
      keyword: doc.keyword,
      title: doc.title,
      field: doc.field,
      description: doc.description,
      imageFilename: await resolveUploadFilename(doc.image, label),
      imageAlt: (typeof doc.image === "object" && doc.image?.alt?.trim()) || "",
      ...(thumbFilename ? { thumbFilename } : {}),
    });
  }
  return topics;
}

export function getHotTopics(): Promise<HotTopic[]> {
  return CONTENT_SOURCE === "cms"
    ? memoizeCms("hot-topics", cmsGetHotTopics)
    : readJson<HotTopic[]>("hot-topics.json");
}
