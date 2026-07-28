import type { Faq } from "./content";

/** FAQPage JSON-LD from visible Q&A (Google requires marked-up text on-page). */
export function buildFaqPageJsonLd(faqs: Faq[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answerHtml },
    })),
  };
}
