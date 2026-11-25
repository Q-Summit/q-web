import type { Field, GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { groupSection, section, seoFields } from "./shared-fields";

// Mirrors PastTeamsContent in apps/web/src/lib/content.ts 1:1. The page is a
// scroll story: a drawn line becomes a camera whose screen is the team photo
// album. The `story` group holds all of its copy; the album photos come from
// the team collection (past teams) plus the Our Team hero photo, which this
// page shares. Until every story field is filled and published, apps/web
// falls back to the old layout (intro plus one photo per year), so `intro`
// and `yearHeading` only matter there. The story fields stay optional at the
// database level so the migration needs no defaults.

/** One optional story text field with its editor help text. */
function storyField(
  name: string,
  description: string,
  type: "text" | "textarea" = "text",
): Field {
  return type === "textarea"
    ? { name, type: "textarea", admin: { description } }
    : { name, type: "text", admin: { description } };
}

export const PagePastTeams: GlobalConfig = pageGlobal({
  slug: "page-past-teams",
  label: "Past Teams",
  path: "/past-teams/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        description: "The title on the team photo at the top of the page.",
      },
    },
    {
      name: "intro",
      type: "textarea",
      required: true,
      admin: {
        description:
          "Shown under the title only while the Story below is not complete. Once every Story field is filled and published, the story replaces it.",
      },
    },
    {
      name: "tabLabel",
      type: "text",
      admin: {
        description:
          'The "History" side of the switch above the team. Empty shows "History".',
      },
    },
    {
      name: "yearHeading",
      type: "text",
      admin: {
        description:
          'Shown only while the Story is not complete: the heading above each year\'s team photo, with {year} for the year. Empty shows "Year {year}".',
      },
    },
    {
      name: "photoAlt",
      type: "text",
      admin: {
        description:
          'What each team photo in the album shows, for screen readers, with {year} for the year. Empty uses "The Q-Summit team of {year}".',
      },
    },
    groupSection({
      label: "Story",
      name: "story",
      description:
        "The scroll story of this page, from the first line to the photo album. Fill in every field: until all of them are filled and published, the page shows the intro and one photo per year instead.",
      fields: [
        storyField(
          "heroEyebrow",
          "The small line above the story's first heading.",
        ),
        storyField("heroHeading", "The first heading of the story."),
        storyField(
          "heroLead",
          "The paragraph under the first heading.",
          "textarea",
        ),
        storyField(
          "cueLabel",
          "The button under the first paragraph that glides through the first part of the story.",
        ),
        storyField(
          "originEyebrow",
          "The small line above the heading about how Q-Summit began.",
        ),
        storyField("originHeading", "The heading about how Q-Summit began."),
        storyField(
          "originSub",
          "The short line under the heading about how Q-Summit began.",
        ),
        storyField(
          "originText",
          "The paragraph about how Q-Summit began.",
          "textarea",
        ),
        storyField(
          "teamsEyebrow",
          "The small line above the heading about the teams over the years.",
        ),
        storyField(
          "teamsHeading",
          "The heading about the teams over the years.",
        ),
        storyField(
          "teamsText",
          "The paragraph about the teams over the years.",
          "textarea",
        ),
        storyField(
          "albumEyebrow",
          "The small line above the heading of the photo album.",
        ),
        storyField(
          "albumHeading",
          "The heading of the photo album on the camera screen.",
        ),
        storyField(
          "albumHint",
          "The hint under the camera on a computer, telling visitors how to flip through the photos.",
        ),
        storyField("albumHintTouch", "The same hint on a phone or tablet."),
        storyField(
          "backLabel",
          "The button under the camera that scrolls back to the start of the story.",
        ),
        storyField(
          "closingEyebrow",
          "The small line above the closing heading at the end of the page.",
        ),
        storyField(
          "closingHeading",
          "The closing heading at the end of the page.",
        ),
        storyField(
          "closingText",
          "The closing paragraph at the end of the page.",
          "textarea",
        ),
        storyField(
          "closingButtonLabel",
          "The button at the end of the page. It always leads to the Our Team page.",
        ),
      ],
    }),
    section("Search and social", seoFields("past teams"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
