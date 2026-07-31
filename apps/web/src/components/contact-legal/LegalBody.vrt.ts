// VRT variants for LegalBody. `html` is rendered verbatim via set:html, so
// these fixtures are plausible German legal markup using the same Webflow
// class names the component's global styles target.
import LegalBody from "./LegalBody.astro";

const short = `
  <div class="padding-global">
    <div class="container-large">
      <div class="padding-section-large">
        <div class="privacy-policy_how-it-works_component">
          <div class="heading-style-h4">Verantwortlicher</div>
          <p class="margin-bottom margin-small">Q-Summit e.V., Musterstrasse 1, 12345 Musterstadt.</p>
          <p>Kontakt: <a href="mailto:info@example.com">info@example.com</a></p>
        </div>
      </div>
    </div>
  </div>
`;

const long = `
  <div class="padding-global">
    <div class="container-large">
      <div class="padding-section-large">
        <div class="privacy-policy_how-it-works_component">
          <div class="heading-style-h4">1. Allgemeine Hinweise</div>
          <p class="margin-bottom margin-small">
            Die folgenden Hinweise geben einen einfachen Ueberblick darueber, was mit Ihren
            personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
            Daten sind alle Daten, mit denen Sie persoenlich identifiziert werden koennen.
          </p>
          <div class="heading-style-h4">2. Datenerfassung auf dieser Website</div>
          <p class="margin-bottom margin-xxlarge">
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
            Kontaktdaten koennen Sie dem Abschnitt Verantwortlicher in dieser Datenschutzerklaerung
            entnehmen. Wenn Sie uns per E-Mail kontaktieren, werden Ihre Angaben zwecks Bearbeitung
            der Anfrage und fuer den Fall von Anschlussfragen bei uns gespeichert.
          </p>
          <p><strong>Ansprechpartner:</strong> <a href="mailto:datenschutz@example.com">datenschutz@example.com</a></p>
        </div>
      </div>
    </div>
  </div>
`;

export default {
  component: LegalBody,
  variants: {
    default: {
      html: short,
    },
    "long-body": {
      html: long,
    },
  },
};
