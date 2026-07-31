// VRT variants for JobBoard. Covers the default list, an empty board (the
// zero-jobs editorial state), and many items stressing vertical rhythm.
import JobBoard from "./JobBoard.astro";
import type { Job } from "../../lib/content";

const job = (
  overrides: Partial<Job> & Pick<Job, "slug" | "company" | "title">,
): Job => ({
  location: "Berlin",
  workload: "Full Time",
  richTextHtml: "<p>Role details.</p>",
  applyUrl: "#",
  logoFilename: "placeholder-logo.svg",
  ...overrides,
});

export default {
  component: JobBoard,
  variants: {
    default: {
      jobs: [
        job({
          slug: "backend-engineer",
          company: "Nordwind Capital",
          title: "Backend Engineer",
        }),
        job({
          slug: "working-student-marketing",
          company: "Bluepeak Ventures",
          title: "Working Student Marketing",
          workload: "Working Student",
        }),
        job({
          slug: "summer-intern",
          company: "Harborline Bank",
          title: "Summer Analyst Intern",
          workload: "Internship",
          location: null,
        }),
      ],
    },
    "many-items": {
      jobs: Array.from({ length: 8 }, (_, i) =>
        job({
          slug: `role-${i + 1}`,
          company: `Company ${i + 1}`,
          title: `Open Position ${i + 1}`,
          workload:
            i % 3 === 0
              ? "Internship"
              : i % 3 === 1
                ? "Working Student"
                : "Full Time",
        }),
      ),
    },
    empty: {
      jobs: [],
    },
  },
};
