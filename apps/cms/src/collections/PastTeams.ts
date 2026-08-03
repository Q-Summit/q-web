import type { CollectionConfig } from "payload";

import { draftCollection } from "./base";

// One group photo per past board year, shown on /past-teams/ and in the
// history panel on /our-team/. Split from the team collection: a year photo
// has no name/role/division, and mixing the two shapes forced every member
// field to be optional. Chair and PR maintain the archive.
export const PastTeams: CollectionConfig = draftCollection({
  slug: "past-teams",
  divisions: ["chair", "pr"],
  useAsTitle: "year",
  defaultColumns: ["year"],
  defaultSort: "-year",
  // One doc per year and no auto-rename can produce a valid unused "YY/YY",
  // so a duplicate could never be saved; hide the button instead.
  disableDuplicate: true,
  description:
    "One group photo per past board year ( /past-teams/ ). Owned by Chair + PR. " +
    "Add a year when a board retires; never overwrite or delete a past year. " +
    "Current members live under Team; page headings are under Website pages.",
  fields: [
    {
      // Board year the photo belongs to; one doc per year (upsert identity).
      name: "year",
      type: "text",
      required: true,
      unique: true,
      validate: (value: unknown) =>
        typeof value === "string" && /^\d{2}\/\d{2}$/.test(value)
          ? true
          : 'Use the board year format "YY/YY", e.g. 25/26.',
      admin: {
        position: "sidebar",
        placeholder: "25/26",
        description:
          'Board year in "YY/YY" format, e.g. 25/26. One entry per year.',
      },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        sortOptions: "-createdAt",
        description: "Group photo of that year's team.",
      },
    },
  ],
});
