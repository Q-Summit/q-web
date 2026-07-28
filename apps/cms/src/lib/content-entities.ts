/**
 * Draft content registries shared by Review queue and Publish audit so the
 * two admin views cannot drift when a collection or page global is added.
 */

export const DRAFT_COLLECTIONS: {
  slug: string;
  label: string;
  titleField: string;
}[] = [
  { slug: "partners", label: "Partners", titleField: "name" },
  { slug: "jobs", label: "Jobs", titleField: "title" },
  { slug: "speakers", label: "Speakers", titleField: "name" },
  { slug: "team", label: "Team", titleField: "name" },
  { slug: "past-teams", label: "Past Teams", titleField: "year" },
  { slug: "faqs", label: "FAQs", titleField: "question" },
  { slug: "testimonials", label: "Testimonials", titleField: "attribution" },
];

/** Labels for page globals + site-wide globals shown in admin queues. */
export const GLOBAL_LABELS: Record<string, string> = {
  "page-home": "Home · /",
  "page-whyq": "Why Q? · /whyq/",
  "page-program": "Program · /program/",
  "page-tickets": "Tickets · /ticket-categories/",
  "page-contact": "Contact · /contact/",
  "page-hackathon": "Hackathon · /hackathon/",
  "page-our-team": "Our Team · /our-team/",
  "page-past-teams": "Past Teams · /past-teams/",
  "page-partner": "Partners · /partner/",
  "page-speaker": "Speakers · /speaker/",
  "page-jobs": "Jobs · /job-listings/",
  "site-settings": "Navigation, footer & AI identity",
  legal: "Legal",
};
