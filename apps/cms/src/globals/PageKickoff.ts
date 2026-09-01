import type { Field, GlobalConfig } from "payload";

import { urlOrMailtoValidate } from "../lib/url-validate";
import { pageGlobal } from "./base";
import {
  groupSection,
  pageLinkGroup,
  section,
  seoFields,
  stringArrayField,
} from "./shared-fields";

const externalUrl = urlOrMailtoValidate({ optional: true });

const imageUpload = (
  name: string,
  label: string,
  description: string,
  required = false,
): Field => ({
  name,
  type: "upload",
  relationTo: "media",
  required,
  label,
  admin: {
    description,
    sortOptions: "-createdAt",
  },
});

const externalLinkField = (
  name: string,
  label: string,
  description: string,
): Field => ({
  name,
  type: "text",
  label,
  admin: { description, placeholder: "https://…" },
  validate: externalUrl,
});

/**
 * Recruiting / Join Q landing at /kickoff/.
 *
 * Layout and quiz scoring stay in Astro. Payload owns the copy, dates,
 * links, quiz data, and images so a new recruiting cycle is a CMS edit.
 */
export const PageKickoff: GlobalConfig = pageGlobal({
  slug: "page-kickoff",
  label: "Join Q / Kickoff",
  path: "/kickoff/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    groupSection({
      label: "Hero",
      name: "hero",
      open: true,
      description:
        "Top recruiting hero. Swap the photo each edition without touching the site code.",
      fields: [
        { name: "eyebrow", type: "text", required: true },
        { name: "headline", type: "text", required: true },
        { name: "copy", type: "textarea", required: true },
        imageUpload(
          "image",
          "Hero image",
          "Wide group photo behind the hero copy. Upload the sharp original.",
        ),
        {
          name: "imageAlt",
          type: "text",
          admin: {
            description:
              "Short description of the hero photo for screen readers. Leave empty only while the image field is empty.",
          },
        },
        pageLinkGroup(
          "primaryCta",
          "Primary hero CTA (usually the team quiz).",
        ),
        pageLinkGroup(
          "secondaryCta",
          "Secondary hero CTA (usually Way through Q).",
        ),
      ],
    }),

    groupSection({
      label: "Kickoff spotlight",
      name: "kickoff",
      description:
        "Panel-talk section near the top. Speaker portraits may stay empty until approved photos arrive.",
      fields: [
        { name: "eyebrow", type: "text", required: true },
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          type: "row",
          fields: [
            {
              name: "date",
              type: "text",
              required: true,
              admin: { width: "50%" },
            },
            {
              name: "location",
              type: "text",
              required: true,
              admin: { width: "50%" },
            },
          ],
        },
        { name: "panelTitle", type: "text", required: true },
        {
          name: "ui",
          type: "group",
          label: "Small UI labels",
          fields: [
            { name: "speakerLabel", type: "text", required: true },
            { name: "linkedinLabel", type: "text", required: true },
            { name: "kickoffLabel", type: "text", required: true },
            { name: "panelLabel", type: "text", required: true },
            {
              name: "registerLabel",
              type: "text",
              admin: {
                description:
                  "Small badge on the location card. Leave empty to hide it.",
              },
            },
            externalLinkField(
              "registerHref",
              "Register URL",
              "Public signup page opened from the badge. Leave empty to keep the badge as a non-link label.",
            ),
          ],
        },
        {
          name: "company",
          type: "group",
          label: "Featured company / brand",
          fields: [
            { name: "name", type: "text", required: true },
            externalLinkField(
              "href",
              "Company website",
              "Official company or brand website opened from the spotlight.",
            ),
            imageUpload(
              "logo",
              "Company logo",
              "Optional brand logo. If empty, the company name is rendered as text.",
            ),
            { name: "logoAlt", type: "text" },
          ],
        },
        {
          name: "speakers",
          type: "array",
          required: true,
          minRows: 1,
          maxRows: 4,
          admin: {
            description:
              "Panel guests shown as portrait cards. Keep the order you want on the website.",
            initCollapsed: true,
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: [
            { name: "name", type: "text", required: true },
            { name: "role", type: "text" },
            { name: "bio", type: "textarea" },
            externalLinkField(
              "linkedin",
              "LinkedIn profile",
              "Full linkedin.com profile URL. The whole speaker card links here when present.",
            ),
            imageUpload(
              "image",
              "Portrait",
              "Portrait used on the speaker card. May be left empty until the final image arrives.",
            ),
            { name: "imageAlt", type: "text" },
            {
              name: "crop",
              type: "group",
              label: "Portrait crop",
              admin: {
                description:
                  "Optional frame for this card. Leave defaults if the photo already sits well.",
              },
              fields: [
                {
                  name: "x",
                  type: "number",
                  min: 0,
                  max: 100,
                  defaultValue: 50,
                  admin: {
                    description: "Horizontal focus, 0 left to 100 right.",
                    width: "25%",
                  },
                },
                {
                  name: "y",
                  type: "number",
                  min: 0,
                  max: 100,
                  defaultValue: 24,
                  admin: {
                    description: "Vertical focus, 0 top to 100 bottom.",
                    width: "25%",
                  },
                },
                {
                  name: "zoom",
                  type: "number",
                  min: 100,
                  max: 160,
                  defaultValue: 100,
                  admin: {
                    description:
                      "How close the photo sits. 100 fills the card.",
                    width: "25%",
                  },
                },
                {
                  name: "shiftY",
                  type: "number",
                  min: -40,
                  max: 40,
                  defaultValue: 0,
                  admin: {
                    description:
                      "Nudge the photo up (negative) or down (positive).",
                    width: "25%",
                  },
                },
              ],
            },
          ],
        },
      ],
    }),

    groupSection({
      label: "Social links",
      name: "socials",
      fields: [
        { name: "eyebrow", type: "text", required: true },
        { name: "heading", type: "text", required: true },
        {
          name: "links",
          type: "array",
          required: true,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: [
            { name: "label", type: "text", required: true },
            {
              name: "icon",
              type: "select",
              required: true,
              options: [
                { label: "WhatsApp", value: "whatsapp" },
                { label: "TikTok", value: "tiktok" },
                { label: "Instagram", value: "instagram" },
                { label: "LinkedIn", value: "linkedin" },
              ],
            },
            externalLinkField("href", "URL", "Public profile / group URL."),
          ],
        },
      ],
    }),

    groupSection({
      label: "Team quiz",
      name: "quiz",
      description:
        "Quiz copy, questions, scoring tags and team result links. The site still owns scoring and animation.",
      fields: [
        { name: "eyebrow", type: "text", required: true },
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "ui",
          type: "group",
          label: "Quiz controls",
          fields: [
            { name: "questionLabel", type: "text", required: true },
            { name: "ofLabel", type: "text", required: true },
            { name: "backLabel", type: "text", required: true },
            { name: "nextLabel", type: "text", required: true },
            { name: "showResultLabel", type: "text", required: true },
            { name: "placeLabel", type: "text", required: true },
            { name: "teamLinkLabel", type: "text", required: true },
          ],
        },
        {
          name: "start",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", required: true },
            { name: "heading", type: "text", required: true },
            { name: "copy", type: "textarea", required: true },
            { name: "buttonLabel", type: "text", required: true },
          ],
        },
        {
          name: "questions",
          type: "array",
          required: true,
          minRows: 1,
          admin: {
            initCollapsed: true,
            description:
              "Questions render in this order. Add or remove rows; the progress bar adapts.",
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: [
            { name: "kicker", type: "text", required: true },
            { name: "question", type: "textarea", required: true },
            {
              name: "answers",
              type: "array",
              required: true,
              minRows: 2,
              admin: { initCollapsed: true },
              fields: [
                {
                  // Not `id`: that name collides with Payload's array-row key
                  // and is stripped on every content-sync round-trip.
                  name: "answerId",
                  type: "text",
                  required: true,
                  admin: {
                    description:
                      "Stable key for this answer (e.g. a1). Keep it unique within the question.",
                  },
                },
                { name: "text", type: "textarea", required: true },
                stringArrayField("tags", {
                  required: true,
                  label: "Team",
                  description:
                    "Exact team names scored by this answer. They must match a Team result name below.",
                }),
              ],
            },
          ],
        },
        {
          name: "results",
          type: "array",
          required: true,
          admin: {
            initCollapsed: true,
            description:
              "One definition per team used by the quiz. Team name must match question answer tags exactly.",
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: [
            { name: "team", type: "text", required: true },
            { name: "text", type: "textarea", required: true },
            externalLinkField(
              "notionHref",
              "Team page URL",
              "Destination for the team result card.",
            ),
          ],
        },
        {
          name: "resultCopy",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", required: true },
            { name: "heading", type: "text", required: true },
            { name: "copy", type: "textarea", required: true },
            { name: "restartLabel", type: "text", required: true },
            pageLinkGroup("applicationCta"),
            pageLinkGroup("allTeamsCta"),
          ],
        },
      ],
    }),

    groupSection({
      label: "Way through Q",
      name: "journey",
      fields: [
        { name: "eyebrow", type: "text", required: true },
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        { name: "hint", type: "text", required: true },
        {
          name: "moments",
          type: "array",
          required: true,
          admin: {
            initCollapsed: true,
            description:
              "Journey cards in display order. Cards without photos keep a text-only layout.",
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: [
            { name: "title", type: "text", required: true },
            { name: "text", type: "textarea", required: true },
            imageUpload(
              "image",
              "Photo",
              "Photo for this journey card. Leave empty until the final image is ready.",
            ),
            { name: "imageAlt", type: "text" },
          ],
        },
      ],
    }),

    groupSection({
      label: "Application flow",
      name: "application",
      fields: [
        { name: "eyebrow", type: "text", required: true },
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "isOpen",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description:
              "Enable only once the real application form is live. Until then, application buttons show the Coming Soon label.",
          },
        },
        externalLinkField(
          "applicationUrl",
          "Application URL",
          "Final Typeform / application link. Used only while Applications open is enabled.",
        ),
        {
          name: "comingSoonLabel",
          type: "text",
          required: true,
          defaultValue: "Coming Soon",
        },
        {
          name: "steps",
          type: "array",
          required: true,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: [
            { name: "date", type: "text", required: true },
            { name: "title", type: "text", required: true },
            { name: "text", type: "textarea", required: true },
          ],
        },
      ],
    }),

    groupSection({
      label: "Final CTA",
      name: "finalCta",
      fields: [
        { name: "eyebrow", type: "text", required: true },
        { name: "heading", type: "text", required: true },
        { name: "copy", type: "textarea", required: true },
        pageLinkGroup("cta", "Final application button."),
      ],
    }),

    section("Search and social", seoFields("Join Q / Kickoff"), {
      description:
        "How the recruiting page looks in Google and when someone shares the link.",
    }),
  ],
});
