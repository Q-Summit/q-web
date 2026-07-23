import type { CollectionConfig } from "payload";

import { orderField } from "../lib/order-field";
import { urlOrMailtoValidate } from "../lib/url-validate";
import { draftCollection } from "./base";

// Job board postings from partner companies. Schema mirrors the legacy
// Webflow collection (site-mirror/extracted/jobs.json); `slug` is the URL
// key and must stay stable so legacy /jobs/<slug> URLs keep resolving.
export const Jobs: CollectionConfig = draftCollection({
  slug: "jobs",
  divisions: ["partner"],
  useAsTitle: "title",
  // See Partners.ts: an upload field cannot render as a thumbnail column.
  defaultColumns: ["title", "company", "location", "order"],
  listSearchableFields: ["title", "company", "location"],
  defaultSort: "order",
  description:
    "Job board postings on /job-listings/. Owned by Partner. " +
    "Slug is the public URL, do not change it on existing postings. " +
    "Page chrome is under Website pages → Jobs.",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Posting",
          admin: {
            description:
              "What the posting says. This is the card on /job-listings/ and the page behind it.",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                  admin: {
                    width: "50%",
                    placeholder: "Working Student Marketing (m/f/d)",
                  },
                },
                {
                  name: "company",
                  type: "text",
                  required: true,
                  admin: { width: "50%", placeholder: "Example GmbH" },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "location",
                  type: "text",
                  admin: {
                    width: "50%",
                    placeholder: "Munich (hybrid)",
                    description: 'Free text, e.g. "Munich (hybrid)".',
                  },
                },
                {
                  name: "workload",
                  type: "select",
                  admin: { width: "50%" },
                  options: [
                    { label: "Full Time", value: "full-time" },
                    { label: "Internship", value: "internship" },
                    { label: "Working Student", value: "working-student" },
                  ],
                },
              ],
            },
            {
              name: "description",
              type: "richText",
              required: true,
              admin: {
                description:
                  "The posting body. Headings, lists and links; images belong in the Logo field on the next tab.",
              },
            },
          ],
        },
        {
          label: "Apply and logo",
          admin: {
            description:
              "Where applicants go, and the mark shown on the job card.",
          },
          fields: [
            {
              name: "applyUrl",
              type: "text",
              required: true,
              admin: {
                placeholder: "https://example.com/careers/123",
                description:
                  "Where the Apply button goes: a link, or a mailto: address if the partner takes applications by email.",
              },
              validate: urlOrMailtoValidate({ allowMailto: true }),
            },
            {
              name: "logo",
              type: "upload",
              relationTo: "media",
              required: true,
              admin: {
                className: "qs-logo-field",
                sortOptions: "-createdAt",
                description: "Company logo shown on the job card.",
              },
              filterOptions: () => ({
                mimeType: { in: ["image/svg+xml", "image/png", "image/webp"] },
              }),
            },
          ],
        },
      ],
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description:
          "The web address of this posting (q-summit.com/jobs/<slug>). Leave it alone on a posting that is already live, or published links break.",
      },
      validate: (value: string | null | undefined) =>
        typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
          ? true
          : "Use lowercase letters, digits, and single hyphens (e.g. acme-working-student).",
    },
    orderField({ collection: "jobs" }),
  ],
});
