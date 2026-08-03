import type { CollectionConfig, NumberFieldSingleValidation } from "payload";

import { orderField } from "../lib/order-field";
import { enforceUniqueKey } from "../lib/unique-key";
import { draftCollection } from "./base";
import { copyLabelOnDuplicate } from "../lib/duplicate-copy";

// Schema mirrors site-mirror/extracted/speakers.json. The Webflow groups map
// to the `group` select as follows:
//   speakers-<year>      -> current    (speaker page, current edition)
//   moderation-<year>    -> moderation (speaker page, current edition)
//   main-stage-homepage  -> panel      (homepage main stage highlights)
//   previous-highlights  -> previous   (speaker page, past editions)
// Editions are modeled via `year`; past entries archive, never overwrite.
const requireYearForCurrentEdition: NumberFieldSingleValidation = (
  value,
  { siblingData },
) => {
  const group = (siblingData as { group?: string }).group;
  if (value == null) {
    return group === "current" || group === "moderation"
      ? "Year is required for current-edition speakers and moderation."
      : true;
  }
  if (!Number.isInteger(value) || value < 2017 || value > 2100) {
    return "Enter a four-digit conference year (2017 or later).";
  }
  return true;
};

export const Speakers: CollectionConfig = draftCollection({
  slug: "speakers",
  divisions: ["pr"],
  useAsTitle: "name",
  defaultColumns: ["name", "role", "company", "group", "year"],
  listSearchableFields: ["name", "role", "company"],
  defaultSort: ["group", "order"],
  description:
    "Speakers and moderators (used on / and /speaker/). Owned by PR. " +
    "Page chrome for /speaker/ is under Website pages → Speakers.",
  // Content-sync upsert identity is name+group (src/content-sync/keys.ts);
  // Payload has no native compound-unique field, so enforce it in a hook.
  beforeChangeHooks: [
    enforceUniqueKey({
      slug: "speakers",
      fields: ["name", "group"],
      entityLabel: "speaker",
    }),
  ],
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          admin: { width: "50%" },
          // name+group is the identity; a verbatim copy is rejected by
          // enforceUniqueKey, so Duplicate renames it.
          hooks: { beforeDuplicate: [copyLabelOnDuplicate] },
        },
        {
          name: "photo",
          type: "upload",
          relationTo: "media",
          admin: {
            width: "50%",
            className: "qs-portrait-field",
            sortOptions: "-createdAt",
            description:
              "Optional. Leave empty until a real photo is available; the card renders without one.",
          },
        },
      ],
    },
    {
      // role + company + roleLine are one decision, not three fields: the card
      // shows roleLine when it is filled and "role, company" when it is not.
      // Grouping them is what makes that relationship visible.
      type: "collapsible",
      label: "Role line",
      admin: {
        initCollapsed: false,
        description:
          "How this person is described on their card, under the name.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "role",
              type: "text",
              required: true,
              admin: {
                width: "50%",
                placeholder: "CEO & Co-Founder",
                description: "Job title or role.",
              },
            },
            {
              name: "company",
              type: "text",
              admin: {
                width: "50%",
                placeholder: "Example GmbH",
                description: "Leave empty if none applies.",
              },
            },
          ],
        },
        {
          name: "roleLine",
          type: "text",
          admin: {
            placeholder: "Co-Founder of SumUp",
            description:
              'Leave empty and the card shows "Role, Company" from the two fields above. Fill this in only when the card needs different wording.',
          },
        },
      ],
    },
    {
      name: "bio",
      type: "textarea",
      admin: {
        // Only the homepage main-stage cards render a bio. This hides the
        // field rather than deleting data: an existing bio stays in the
        // database if the group later changes.
        condition: (_data, siblingData) =>
          (siblingData as { group?: string })?.group === "panel",
        description:
          "Short bio paragraph, shown on the homepage main-stage card.",
      },
    },
    {
      name: "group",
      type: "select",
      required: true,
      defaultValue: "current",
      options: [
        { label: "Current edition speakers", value: "current" },
        { label: "Moderation (current edition)", value: "moderation" },
        { label: "Main stage highlight (homepage)", value: "panel" },
        { label: "Previous highlights", value: "previous" },
      ],
      admin: {
        position: "sidebar",
        description: "Where the speaker appears on the site.",
      },
    },
    {
      name: "year",
      type: "number",
      validate: requireYearForCurrentEdition,
      admin: {
        position: "sidebar",
        placeholder: "2026",
        description:
          "Conference edition year, e.g. 2026. Required for current-edition entries; optional for highlights when the edition is unknown.",
      },
    },
    orderField({ collection: "speakers", scope: "within its group" }),
  ],
});
