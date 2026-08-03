import type { CollectionConfig } from "payload";

import { DIVISIONS } from "../access";
import { orderField } from "../lib/order-field";
import { enforceUniqueKey } from "../lib/unique-key";
import { urlOrMailtoValidate } from "../lib/url-validate";
import { draftCollection } from "./base";
import { copyLabelOnDuplicate } from "../lib/duplicate-copy";

const isUrl = urlOrMailtoValidate({ optional: true });

/**
 * Optional LinkedIn profile URL. Checks the host as well as the shape: the
 * common mistakes here are pasting a search result, a company page, or a bare
 * handle, and all three render a broken icon on the live card rather than
 * failing loudly.
 */
const linkedinUrlValidate = (
  value: string | null | undefined,
): true | string => {
  if (typeof value !== "string" || value.length === 0) return true;
  const shape = isUrl(value);
  if (shape !== true) return shape;
  const host = new URL(value).hostname.replace(/^www\./, "");
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
    return "Use a linkedin.com profile address, e.g. https://www.linkedin.com/in/jane-doe/.";
  }
  return true;
};

// Current team members shown on /our-team/, grouped by division. Past board
// years are one group photo each in the separate past-teams collection, so
// every field here is a real member field. Chair and PR maintain the roster.
export const Team: CollectionConfig = draftCollection({
  slug: "team",
  divisions: ["chair", "pr"],
  useAsTitle: "name",
  defaultColumns: ["name", "role", "division", "year"],
  listSearchableFields: ["name", "role"],
  defaultSort: ["division", "order"],
  description:
    "Current board and team members ( /our-team/ ). Owned by Chair + PR. " +
    "When a board retires, add its group photo under Past Teams. " +
    "Page headings are under Website pages.",
  // Content-sync upsert identity is name+year (src/content-sync/keys.ts);
  // Payload has no native compound-unique field, so enforce it in a hook.
  beforeChangeHooks: [
    enforceUniqueKey({
      slug: "team",
      fields: ["name", "year"],
      entityLabel: "team member",
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
          // name+year is the identity; a verbatim copy is rejected by
          // enforceUniqueKey, so Duplicate renames it.
          hooks: { beforeDuplicate: [copyLabelOnDuplicate] },
        },
        {
          name: "role",
          type: "text",
          required: true,
          admin: {
            width: "50%",
            placeholder: "Head of Hackathon",
            description: "Position title.",
          },
        },
      ],
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        className: "qs-portrait-field",
        sortOptions: "-createdAt",
        description: "Portrait shown on /our-team/.",
      },
    },
    {
      // Optional, not required: not everyone has a profile they want linked,
      // and the roster is filled in gradually. The card simply omits the icon
      // when this is empty.
      name: "linkedin",
      type: "text",
      label: "LinkedIn profile",
      admin: {
        placeholder: "https://www.linkedin.com/in/jane-doe/",
        description:
          "Full profile address. Shown as a LinkedIn icon on the member's card; leave empty to show no icon.",
      },
      validate: linkedinUrlValidate,
    },
    {
      // Optional for the same reason as linkedin: addresses land on the
      // roster gradually, and the card simply omits the icon when this is
      // empty. Payload's email field type validates the address shape.
      name: "email",
      type: "email",
      label: "Email address",
      admin: {
        placeholder: "jane.doe@q-summit.com",
        description:
          "Shown as a mail icon on the member's card; leave empty to show no icon.",
      },
    },
    {
      // Display grouping on the team page. Reuses the shared division list
      // (single source of truth); the site maps values to headings, e.g.
      // "pr" renders as "Public Relations".
      name: "division",
      type: "select",
      required: true,
      options: [...DIVISIONS],
      admin: {
        position: "sidebar",
        description:
          "Which section this person appears under on /our-team/. The site spells the " +
          'short names out, so "pr" shows as "Public Relations".',
      },
    },
    {
      // Board year the member served in; drives the past-teams archive.
      name: "year",
      type: "text",
      required: true,
      validate: (value: unknown) =>
        typeof value === "string" && /^\d{2}\/\d{2}$/.test(value)
          ? true
          : 'Use the board year format "YY/YY", e.g. 26/27.',
      admin: {
        position: "sidebar",
        placeholder: "26/27",
        description: 'Board year in "YY/YY" format, e.g. 26/27.',
      },
    },
    orderField({ collection: "team", scope: "within its division" }),
  ],
});
