/**
 * Frozen analytics event taxonomy -- the single source of truth for event
 * names. `scripts/check/events.mjs` fails the build on any captured name
 * outside EVENTS and on any PII-looking property key, so adding an event
 * means adding it here first (name, firing rule, properties) in the same PR.
 *
 * Naming: object_action, snake_case, past tense throughout (views included).
 * Events are anonymous (ADR-0003): no PII in names or properties, ever.
 * The PostHog funnels and dashboards reference these exact names; renaming
 * one silently breaks the hosted insights, so names are append-only.
 *
 * Components reference these via `data-ph-event={EVENTS.x}` (click),
 * `data-ph-toggle-event={EVENTS.x}` (details open), or the Base layout's
 * `pageEvent` prop (once per page load); `lib/analytics/dom.ts` owns the
 * delegated listeners. Properties ride along as `data-ph-prop-*` attributes.
 */
export const EVENTS = {
  /** Buy CTA on a ticket tier card; top of the purchase funnel handoff to the external shop. Props: tier_name, tier_price. */
  ticket_purchase_initiated: "ticket_purchase_initiated",
  /** Ticket categories page viewed; top of the ticket funnel. */
  ticket_page_viewed: "ticket_page_viewed",
  /** Primary CTA in the homepage hero. Props: cta_label, cta_href. */
  hero_cta_clicked: "hero_cta_clicked",
  /** "Join Us as a Partner" CTA on the partner page. Props: cta_label. */
  partner_cta_clicked: "partner_cta_clicked",
  /** Hackathon contact CTA. Props: cta_href. */
  hackathon_contact_clicked: "hackathon_contact_clicked",
  /** Job listing detail page viewed; top of the job application funnel. Props: job_title, company, slug. */
  job_listing_viewed: "job_listing_viewed",
  /** Apply button on a job listing detail page. Props: job_title, company, apply_type. */
  job_application_started: "job_application_started",
  /** Mailto contact link on the contact page. Props: contact_label. */
  contact_email_clicked: "contact_email_clicked",
  /** FAQ accordion item opened on the homepage. Props: question. */
  faq_opened: "faq_opened",
  /** CTA button in the homepage "Why Attend" section. Props: cta_href. */
  why_attend_cta_clicked: "why_attend_cta_clicked",
} as const;

export type EventName = keyof typeof EVENTS;
