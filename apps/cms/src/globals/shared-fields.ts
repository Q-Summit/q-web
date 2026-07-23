import type { Field } from "payload";

import { urlOrMailtoValidate } from "../lib/url-validate";

/*
 * Reusable field shapes shared across the page-* globals, so the same
 * semantic structure (PageLink, string[] copy lists, agenda items, ...)
 * from apps/web/src/lib/content.ts is not hand-typed a dozen times over.
 * Every builder here mirrors a TypeScript interface in content.ts 1:1;
 * keep the two in sync when either changes.
 */

/**
 * Collapsed row label + shared array admin options. Every array in the page
 * globals used to render its rows as "Item 01", so a page with several arrays
 * was a stack of numbered rows you had to open one at a time.
 */
const arrayAdmin = (description?: string) => ({
  ...(description ? { description } : {}),
  initCollapsed: true,
  components: {
    RowLabel: "/components/array-row-label#TitleRowLabel",
  },
});

/**
 * One section of a page global: a labelled, collapsible block.
 *
 * The page globals were flat stacks of top-level groups, each costing about
 * 40px of padding on both edges, so /page-home opened as several thousand
 * pixels of form with no way to see its shape. Unnamed collapsible, so it
 * adds no column and needs no migration.
 */
export function section(
  label: string,
  fields: Field[],
  opts?: { description?: string; initCollapsed?: boolean },
): Field {
  return {
    type: "collapsible",
    label,
    admin: {
      initCollapsed: opts?.initCollapsed ?? true,
      ...(opts?.description ? { description: opts.description } : {}),
    },
    fields,
  };
}

/**
 * One named group rendered as a collapsible section.
 *
 * The page globals stored their content as top-level named groups, each of
 * which renders its own gutter, heading and padding. Seven of them stacked
 * open meant /page-home opened as thousands of pixels of form with no way to
 * see its shape. This keeps the stored group exactly as it is -- so no
 * migration and no change to what apps/web reads -- and only changes how it
 * renders: the collapsible supplies the heading and the collapse affordance,
 * and the group inside drops its own label and gutter so the chrome is not
 * doubled.
 */
export function groupSection(opts: {
  /** Heading shown on the collapsible. */
  label: string;
  /** Stored group name; must not change (it is the REST/JSON key). */
  name: string;
  description?: string;
  /** Open on load. Use for the one section an editor edits most. */
  open?: boolean;
  fields: Field[];
}): Field {
  return {
    type: "collapsible",
    label: opts.label,
    admin: {
      initCollapsed: !opts.open,
      ...(opts.description ? { description: opts.description } : {}),
    },
    fields: [
      {
        name: opts.name,
        type: "group",
        label: false,
        admin: { hideGutter: true },
        fields: opts.fields,
      },
    ],
  };
}

/** SEO fields every page global starts with (HomeContent.title etc). */
export function seoFields(pageLabel: string): Field[] {
  return [
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: `Browser tab and social-share title for the ${pageLabel} page (shown as "Q-Summit | …").`,
      },
    },
    {
      name: "metaDescription",
      type: "textarea",
      admin: {
        description:
          "Search snippet and WhatsApp/LinkedIn preview text. Also the one-line note for this page in /llms.txt. Aim for 120 to 160 characters.",
      },
    },
  ];
}

/** A single string, e.g. one announcement line, feature bullet, or logo name. */
export function stringArrayField(
  name: string,
  opts?: { required?: boolean; label?: string; description?: string },
): Field {
  return {
    name,
    type: "array",
    required: opts?.required,
    labels: opts?.label
      ? { singular: opts.label, plural: `${opts.label}s` }
      : undefined,
    admin: arrayAdmin(opts?.description),
    fields: [{ name: "text", type: "text", required: true }],
  };
}

/** PageLink = { label, href } (nav items, footer links, CTAs). */
export function pageLinkFields(): Field[] {
  return [
    { name: "label", type: "text", required: true },
    {
      name: "href",
      type: "text",
      required: true,
      admin: {
        description:
          'A full URL (https://...), a mailto: address, an internal path (e.g. "/whyq"), ' +
          'or an in-page anchor (e.g. "#why-attend").',
      },
      validate: urlOrMailtoValidate({ allowRelative: true, allowMailto: true }),
    },
  ];
}

/** A named group shaped like PageLink, e.g. a `cta` field on a section. */
export function pageLinkGroup(name: string, description?: string): Field {
  return {
    name,
    type: "group",
    admin: description ? { description } : undefined,
    fields: pageLinkFields(),
  };
}

/** PageStat = { value, label, logos?: string[] } (home hero/partner stats). */
export function pageStatArrayField(name: string, description?: string): Field {
  return {
    name,
    type: "array",
    admin: arrayAdmin(description),
    fields: [
      { name: "value", type: "text", required: true },
      { name: "label", type: "text", required: true },
      stringArrayField("logos", {
        label: "Logo",
        description:
          "Partner/company names shown in the logo band (index page only).",
      }),
    ],
  };
}

/** AgendaItem = { date, title, description } (program/hackathon schedule rows). */
export function agendaItemsField(name: string, description?: string): Field {
  return {
    name,
    type: "array",
    admin: arrayAdmin(description),
    fields: [
      { name: "date", type: "text", required: true },
      { name: "title", type: "text", required: true },
      { name: "description", type: "textarea", required: true },
    ],
  };
}

/** { title, description } cards (WhyCard / FeatureCard). */
export function titleDescriptionArrayField(
  name: string,
  description?: string,
): Field {
  return {
    name,
    type: "array",
    admin: arrayAdmin(description),
    fields: [
      { name: "title", type: "text", required: true },
      { name: "description", type: "textarea", required: true },
    ],
  };
}
