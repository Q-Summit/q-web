// VRT variants for JoinCta. Covers the default copy length and a long
// heading/text pair that must still wrap cleanly next to the button.
import JoinCta from "./JoinCta.astro";

export default {
  component: JoinCta,
  variants: {
    default: {
      heading: "Join us as a partner",
      text: "Reach thousands of ambitious students, founders and investors at Germany's largest student-organized startup conference.",
      buttonLabel: "Become a partner",
      buttonHref: "#",
    },
    "long-copy": {
      heading: "Become a strategic partner for the next Q-Summit conference",
      text: "Partnering with Q-Summit puts your brand in front of thousands of ambitious students, founders and investors across two days of keynotes, workshops and the partner expo, with tailored packages available for every budget and goal.",
      buttonLabel: "Talk to our partnerships team about your options",
      buttonHref: "#",
    },
    german: {
      heading: "Werde Partner von Q-Summit",
      text: "Erreiche tausende ambitionierte Studierende, Gruender und Investoren auf Deutschlands groesster studentisch organisierter Startup-Konferenz.",
      buttonLabel: "Jetzt Partner werden",
      buttonHref: "#",
    },
  },
};
