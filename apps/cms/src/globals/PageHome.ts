import type { Field, GlobalConfig, NumberFieldSingleValidation } from "payload";

import { urlOrMailtoValidate } from "../lib/url-validate";
import { pageGlobal } from "./base";
import {
  groupSection,
  pageLinkGroup,
  pageStatArrayField,
  section,
  seoFields,
  stringArrayField,
  titleDescriptionArrayField,
} from "./shared-fields";

/*
 * Homepage for the 2027 edition.
 *
 * Mirrors HomeContent and CmsPageHomeDoc in
 * apps/web/src/lib/content/pages.ts 1:1: names and nesting are the REST keys
 * the site reads. Everything added for 2027 (hero badge and lead lines,
 * countdown, partner row descriptions, audience tile links and photos,
 * speaker highlights and lineup, social) is optional at the schema level, so
 * the page published before these fields existed stays valid and publishable
 * untouched, and the migration only adds nullable columns and new tables.
 * The site hides each new part until its fields are filled.
 *
 * Validators below pass on empty values for the same reason: drafts are
 * validated on save (access/index.ts draftVersionsGlobal), so a validator
 * that asked for a new field would block saving an untouched page.
 */

const COUNTDOWN_PLACEHOLDERS = ["days", "hours", "minutes"] as const;

/**
 * The sentence read out instead of the countdown digits keeps {days},
 * {hours} and {minutes} once it is filled; the site replaces them with the
 * numbers (apps/web/src/lib/countdown.ts spokenRemaining).
 */
export const validateSpokenLabel = (value: unknown): true | string => {
  if (typeof value !== "string" || !value.trim()) return true;
  const missing = COUNTDOWN_PLACEHOLDERS.filter(
    (placeholder) => !value.includes(`{${placeholder}}`),
  );
  return missing.length === 0
    ? true
    : `Keep ${missing.map((p) => `{${p}}`).join(" and ")} in the text; the site replaces them with the numbers.`;
};

/** Whole conference year, the same range the speakers' own year accepts. */
export const validateLineupYear: NumberFieldSingleValidation = (value) => {
  if (value == null) return true;
  return Number.isInteger(value) && value >= 2017 && value <= 2100
    ? true
    : "Enter a four-digit conference year (2017 or later).";
};

/** Whole number of lineup cards, 1 to 8. Empty passes: the site uses 4. */
export const validateLineupSlots: NumberFieldSingleValidation = (value) => {
  if (value == null) return true;
  return Number.isInteger(value) && value >= 1 && value <= 8
    ? true
    : "Enter a whole number from 1 to 8.";
};

/**
 * The social section shows once its heading is filled and then renders
 * every one of its texts (the two labels name the profile links), so they
 * are required from that moment on. Without a heading the section is off
 * and nothing is asked for.
 */
export const requiredWithSocialHeading = (
  value: unknown,
  { siblingData }: { siblingData: unknown },
): true | string => {
  const heading = (siblingData as { heading?: unknown } | undefined)?.heading;
  const sectionOn = typeof heading === "string" && heading.trim() !== "";
  return !sectionOn || (typeof value === "string" && value.trim() !== "")
    ? true
    : "Required while the section has a heading.";
};

// Extra fields on each whyAttend card (WhyCard in pages.ts). Passed to the
// shared title/description helper so only this array gains the columns.
const audienceTileFields: Field[] = [
  {
    name: "eyebrow",
    type: "text",
    admin: {
      description: 'Small label above the title, e.g. "For founders".',
    },
  },
  {
    name: "href",
    type: "text",
    admin: {
      description:
        'Where the tile leads: an internal path (e.g. "/whyq/students") or a full URL (https://...). ' +
        "Leave empty and the tile is not a link.",
    },
    // Same rule as every other internal link (pageLinkFields), but optional.
    validate: urlOrMailtoValidate({
      optional: true,
      allowRelative: true,
      allowMailto: true,
    }),
  },
  {
    name: "linkLabel",
    type: "text",
    admin: {
      description: 'Text of the link on the tile, e.g. "Learn more".',
    },
  },
  {
    name: "image",
    type: "upload",
    relationTo: "media",
    admin: {
      description:
        "Photo on the tile. Upload the sharp original. Leave empty and the tile shows without a photo.",
      sortOptions: "-createdAt",
    },
  },
  {
    name: "imageAlt",
    type: "text",
    admin: {
      description:
        "Short description of the photo for screen readers. Leave empty only while there is no photo.",
    },
  },
];

export const PageHome: GlobalConfig = pageGlobal({
  slug: "page-home",
  label: "Home",
  path: "/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    groupSection({
      label: "Hero",
      name: "hero",
      open: true,
      description:
        "Top of the page over the video: badge, headline, lead lines, button and tagline.",
      fields: [
        {
          name: "badge",
          type: "text",
          admin: {
            description:
              'Small pill above the headline, e.g. "10th edition · April 1 to 2, 2027 · Mannheim". Leave empty to hide it.',
          },
        },
        { name: "headline", type: "text", required: true },
        { name: "tagline", type: "text", required: true },
        stringArrayField("leadLines", {
          label: "Lead line",
          description:
            "Short lines under the headline, one per row. When filled, they are shown instead of the announcement lines.",
        }),
        stringArrayField("announcementLines", {
          label: "Announcement line",
          description:
            "Banner lines (e.g. thank-you message, next date). Each row is one line. Shown only while there are no lead lines.",
        }),
        pageLinkGroup(
          "cta",
          'Hero call-to-action, e.g. {label: "Learn more", href: "#why-attend"}.',
        ),
      ],
    }),
    groupSection({
      label: "Conference dates",
      name: "event",
      description:
        "Conference dates. The hero countdown counts down to the start date (to 00:00 German " +
        "time on that day), and both dates feed the event details search engines read (the " +
        "rich result that can show the date in Google). Neither date is printed as text: " +
        "write the date visitors read in the hero badge or lead lines above.",
      fields: [
        {
          name: "startDate",
          type: "date",
          required: true,
          admin: {
            date: { pickerAppearance: "dayOnly", displayFormat: "yyyy-MM-dd" },
            description: "First day of the conference.",
          },
        },
        {
          name: "endDate",
          type: "date",
          required: true,
          admin: {
            date: { pickerAppearance: "dayOnly", displayFormat: "yyyy-MM-dd" },
            description:
              "Last day of the conference. Same as the start date for a one-day event.",
          },
          validate: (
            value: unknown,
            { siblingData }: { siblingData: unknown },
          ) => {
            const start = (siblingData as { startDate?: unknown } | undefined)
              ?.startDate;
            if (!value || !start) return true;
            return new Date(String(value)) >= new Date(String(start))
              ? true
              : "End date cannot be before the start date.";
          },
        },
      ],
    }),
    // No date field on purpose: the target is event.startDate at 00:00
    // Europe/Berlin (apps/web/src/lib/countdown.ts), so there is one date to
    // maintain. The site shows the countdown only once every label is filled.
    groupSection({
      label: "Countdown",
      name: "countdown",
      description:
        "Countdown in the hero. It has no date of its own: it counts down to the start date " +
        "under Conference dates, to 00:00 German time (Europe/Berlin) on that day. That is the " +
        "very start of the first conference day, not the time the doors open. Only the wording " +
        "is set here. The countdown appears once every field in this section is filled; leave " +
        "them all empty to hide it.",
      fields: [
        {
          name: "label",
          type: "text",
          admin: {
            description:
              'Name of the countdown for screen readers, e.g. "Countdown to Q-Summit 2027".',
          },
        },
        {
          type: "row",
          fields: [
            {
              name: "daysLabel",
              type: "text",
              admin: { width: "25%", description: 'e.g. "Days".' },
            },
            {
              name: "hoursLabel",
              type: "text",
              admin: { width: "25%", description: 'e.g. "Hours".' },
            },
            {
              name: "minutesLabel",
              type: "text",
              admin: { width: "25%", description: 'e.g. "Minutes".' },
            },
            {
              name: "secondsLabel",
              type: "text",
              admin: { width: "25%", description: 'e.g. "Seconds".' },
            },
          ],
        },
        {
          name: "spokenLabel",
          type: "text",
          admin: {
            description:
              "Sentence screen readers hear instead of the digits. Keep {days}, {hours} and {minutes}; " +
              'the site replaces them with the numbers, e.g. "{days} days, {hours} hours and {minutes} minutes until Q-Summit 2027".',
          },
          validate: validateSpokenLabel,
        },
        {
          name: "liveLabel",
          type: "text",
          admin: {
            description:
              'Shown in place of the countdown once the first conference day has begun, e.g. "Q-Summit 2027 is live".',
          },
        },
      ],
    }),
    groupSection({
      label: "Stats",
      name: "stats",
      description: '"Join us to be with" stats section.',
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        pageStatArrayField(
          "items",
          "Headline numbers, e.g. 1500 Participants.",
        ),
      ],
    }),
    groupSection({
      label: "Partner band",
      name: "partnerBand",
      description: "Partner logo rows beneath the stats.",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          admin: {
            description:
              "Small label above the heading. Leave empty to hide it.",
          },
        },
        {
          name: "heading",
          type: "text",
          admin: {
            description:
              'Heading of the section. Always name the edition the logos are from, e.g. "Partners of Q-Summit 2026".',
          },
        },
        pageStatArrayField(
          "items",
          "One row of logos per entry (e.g. Startups, Corporates, Network), in display order.",
          {
            // The 2027 rows show label, description and logos; the count
            // beside the label is gone, so a row no longer needs one.
            optionalValue:
              'Count beside the label on the previous homepage, e.g. "50+". The new homepage does not show it, so it may stay empty.',
            rowDescription:
              'Short line under the label, e.g. "Founders & scale-ups". Leave empty to show the label alone.',
          },
        ),
        pageLinkGroup("cta"),
      ],
    }),
    groupSection({
      label: "Previous speakers",
      name: "previousSpeakers",
      description:
        "Speaker section: highlights from past editions and, once speakers are announced, " +
        "the lineup of the next edition. Photos and roles come from the Speakers list.",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          admin: {
            description:
              "Small label above the heading. Leave empty to hide it.",
          },
        },
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "alumniLabel",
          type: "text",
          admin: {
            description:
              'Badge on past speakers, e.g. "Q-Summit Alumni", so nobody reads them as booked for the next edition. Leave empty for no badge.',
          },
        },
        stringArrayField("highlights", {
          label: "Highlight",
          description:
            "Names of past speakers to show, in this order. Write each name exactly as it reads in the Speakers list. " +
            'Leave empty to show every speaker in the group "Main stage highlight (homepage)".',
        }),
        {
          name: "lineup",
          type: "group",
          admin: {
            description:
              "Speakers of the next edition, shown after the past speakers. The cards are the published speakers in the group " +
              '"Current edition speakers" with the year set here, so publishing a speaker fills a slot. ' +
              "The lineup appears once Label and Year are filled.",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "label",
                  type: "text",
                  admin: {
                    width: "34%",
                    description: 'Badge on each lineup card, e.g. "2027".',
                  },
                },
                {
                  name: "year",
                  type: "number",
                  admin: {
                    width: "33%",
                    step: 1,
                    description:
                      "Conference year whose speakers fill the lineup, e.g. 2027.",
                  },
                  validate: validateLineupYear,
                },
                {
                  name: "slots",
                  type: "number",
                  defaultValue: 4,
                  min: 1,
                  max: 8,
                  admin: {
                    width: "33%",
                    step: 1,
                    description: "How many cards the lineup holds, 1 to 8.",
                  },
                  validate: validateLineupSlots,
                },
              ],
            },
            {
              name: "showPlaceholders",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description:
                  "For previews only. Fills open lineup slots with clearly marked placeholder cards, so the layout " +
                  "can be checked before speakers are announced. Keep this off for the live site: with it off, " +
                  "open slots are simply not shown.",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "placeholderName",
                  type: "text",
                  admin: {
                    width: "50%",
                    description:
                      'Name on a placeholder card, e.g. "Speaker to be announced". Only used while Show Placeholders is on.',
                  },
                },
                {
                  name: "placeholderRole",
                  type: "text",
                  admin: {
                    width: "50%",
                    description:
                      "Line under the name on a placeholder card. Only used while Show Placeholders is on.",
                  },
                },
              ],
            },
          ],
        },
        // Beside the lineup group, not inside it: nested one level deeper the
        // version table's index names would pass Postgres' 63 characters.
        stringArrayField("standIns", {
          label: "Stand-in",
          description:
            "Earlier speakers to show in the lineup's place while no speaker of the lineup year is published yet. " +
            "Write each name exactly as it reads in the Speakers list. They disappear on their own as soon as the first speaker of that year is published.",
        }),
        {
          name: "standInLabel",
          type: "text",
          admin: {
            description:
              'Badge on a stand-in card, e.g. "Q-Summit 2026". It must say where the person spoke, so nobody reads them as booked for the next edition.',
          },
        },
        pageLinkGroup("cta"),
      ],
    }),
    groupSection({
      label: "Why attend",
      name: "whyAttend",
      description:
        "Audience tiles: one tile per audience, each leading to its own page.",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          admin: {
            description:
              "Small label above the heading. Leave empty to hide it.",
          },
        },
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        titleDescriptionArrayField(
          "cards",
          "One tile per audience (e.g. students, startups, corporates, investors), in display order.",
          { extraFields: audienceTileFields },
        ),
        pageLinkGroup("cta"),
      ],
    }),
    groupSection({
      label: "Social",
      name: "social",
      description:
        "LinkedIn and Instagram section. It appears once Heading is filled; leave Heading empty to " +
        "hide the whole section. The two profile links are not set here: they come from Site " +
        "Settings (Navigation, footer & AI identity, under Footer, the LinkedIn and Instagram " +
        "(Q-Summit) social links).",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          admin: { description: "Small label above the heading." },
          validate: requiredWithSocialHeading,
        },
        {
          name: "heading",
          type: "text",
          admin: {
            description:
              "Heading of the section. Filling it switches the section on.",
          },
        },
        {
          name: "intro",
          type: "textarea",
          admin: { description: "Short text under the heading." },
          validate: requiredWithSocialHeading,
        },
        {
          type: "row",
          fields: [
            {
              name: "linkedinLabel",
              label: "LinkedIn Label",
              type: "text",
              admin: {
                width: "50%",
                description:
                  'Text of the LinkedIn profile link, e.g. "Follow us on LinkedIn".',
              },
              validate: requiredWithSocialHeading,
            },
            {
              name: "instagramLabel",
              type: "text",
              admin: {
                width: "50%",
                description:
                  'Text of the Instagram profile link, e.g. "Follow us on Instagram".',
              },
              validate: requiredWithSocialHeading,
            },
          ],
        },
        {
          name: "posts",
          type: "array",
          // The page shows the newest four (apps/web lib/social-posts.ts);
          // the rows beyond that are history the editor may clear out.
          maxRows: 12,
          labels: { singular: "Post", plural: "Posts" },
          admin: {
            initCollapsed: true,
            description:
              "Add every new post as the last row. The page shows the newest four as image tiles that open the post: the last row at the far left, each older one a place further right. An older post drops out by itself, so nothing has to be moved or deleted (rows that no longer show may be removed). Without posts the section shows empty frames.",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "platform",
                  type: "select",
                  required: true,
                  options: [
                    { label: "LinkedIn", value: "linkedin" },
                    { label: "Instagram", value: "instagram" },
                  ],
                  admin: { width: "30%" },
                },
                {
                  name: "href",
                  type: "text",
                  required: true,
                  admin: {
                    width: "70%",
                    description:
                      "Full address of the post, starting with https://.",
                  },
                  validate: urlOrMailtoValidate(),
                },
              ],
            },
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              required: true,
              admin: {
                description:
                  "Image of the post, served from our own media library. Upload the sharp original.",
                sortOptions: "-createdAt",
              },
            },
            {
              name: "imageAlt",
              type: "text",
              admin: {
                description:
                  "Short description of the post image for screen readers.",
              },
            },
          ],
        },
      ],
    }),
    // Kept stored exactly as is: the 2027 homepage has no FAQ teaser, and a
    // named group is never removed or reshaped (apps/cms AGENTS.md).
    groupSection({
      label: "FAQ teaser",
      name: "faqSection",
      description:
        "FAQ teaser section. Currently not shown on the homepage; the content is kept.",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        pageLinkGroup("cta"),
      ],
    }),
    section("Search and social", seoFields("home"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
