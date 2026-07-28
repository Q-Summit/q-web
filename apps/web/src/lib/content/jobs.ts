/**
 * Jobs collection.
 */
import { lexicalToHtml } from "../lexical-html";
import { fetchPublishedDocs, memoizeCms, stableOrderCompare } from "./cms";
import { resolveUploadFilename, type CmsMediaRef } from "./media";
import { CONTENT_SOURCE, readJson } from "./source";

export type JobWorkload = "Full Time" | "Internship" | "Working Student";

export interface Job {
  slug: string;
  company: string;
  title: string;
  /** Only present on jobs that appeared on page 1 of the index tabs. */
  location: string | null;
  workload: JobWorkload | null;
  /** Sanitized rich text: h3 section headings plus semantic body markup. */
  richTextHtml: string;
  /** http(s) ATS link or mailto: address. */
  applyUrl: string;
  logoFilename: string;
}

// workload select values (Jobs.ts) -> the display labels this module exports.
const JOB_WORKLOAD_LABELS: Record<string, JobWorkload> = {
  "full-time": "Full Time",
  internship: "Internship",
  "working-student": "Working Student",
};

interface CmsJobDoc {
  slug: string;
  company: string;
  title: string;
  location?: string | null;
  workload?: string | null;
  description: unknown;
  applyUrl: string;
  logo: CmsMediaRef | number | string | null;
  order?: number | null;
}

async function cmsGetJobs(): Promise<Job[]> {
  const docs = await fetchPublishedDocs<CmsJobDoc>("jobs");
  docs.sort(stableOrderCompare);
  const jobs: Job[] = [];
  for (const doc of docs) {
    let workload: JobWorkload | null = null;
    if (doc.workload) {
      workload = JOB_WORKLOAD_LABELS[doc.workload] ?? null;
      if (!workload) {
        console.warn(
          `[content:cms] unmapped job workload "${doc.workload}" for job "${doc.slug}"`,
        );
      }
    }
    jobs.push({
      slug: doc.slug,
      company: doc.company,
      title: doc.title,
      location: doc.location ?? null,
      workload,
      richTextHtml: lexicalToHtml(doc.description),
      applyUrl: doc.applyUrl,
      logoFilename: await resolveUploadFilename(doc.logo, `job ${doc.slug}`),
    });
  }
  return jobs;
}

export function getJobs(): Promise<Job[]> {
  return CONTENT_SOURCE === "cms"
    ? memoizeCms("jobs", cmsGetJobs)
    : readJson<Job[]>("jobs.json");
}
