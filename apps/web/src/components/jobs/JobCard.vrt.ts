// VRT variants for JobCard. Covers the default card, a long company/title
// pair that must wrap, and a card missing the optional location/workload
// fields.
import JobCard from "./JobCard.astro";
import type { Job } from "../../lib/content";

export default {
  component: JobCard,
  variants: {
    default: {
      job: {
        slug: "backend-engineer",
        company: "Nordwind Capital",
        title: "Backend Engineer",
        location: "Berlin",
        workload: "Full Time",
        richTextHtml: "<p>Role details.</p>",
        applyUrl: "#",
        logoFilename: "placeholder-logo.svg",
      } satisfies Job,
    },
    "long-copy": {
      job: {
        slug: "senior-platform-engineer-growth-team",
        company: "Harborline Bank International Investment Group",
        title: "Senior Platform Engineer, Growth and Infrastructure Team",
        location: "Frankfurt am Main, hybrid",
        workload: "Full Time",
        richTextHtml: "<p>Role details.</p>",
        applyUrl: "#",
        logoFilename: "placeholder-logo.svg",
      } satisfies Job,
    },
    minimal: {
      job: {
        slug: "campus-ambassador",
        company: "Bluepeak Ventures",
        title: "Campus Ambassador",
        location: null,
        workload: null,
        richTextHtml: "<p>Role details.</p>",
        applyUrl: "#",
        logoFilename: "placeholder-logo.svg",
      } satisfies Job,
    },
  },
};
