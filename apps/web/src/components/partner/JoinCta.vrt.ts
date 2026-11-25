// VRT variants for JoinCta ("Become a Partner"). Covers the contact card
// with its points and the three audience links, long copy that must wrap,
// and the section with no contact and no audience filled in yet (only the
// text and the button to the partner form).
import JoinCta from "./JoinCta.astro";

const audience = (key: string, label: string) => ({
  key,
  href: `/partner/${key}/`,
  label,
  summary:
    "Placeholder summary. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
  linkLabel: `Partner as a ${key}`,
});

const audiences = [
  audience("startup", "Startups"),
  audience("corporate", "Corporates"),
  audience("investor", "Investors"),
];

const contact = {
  name: "Alex Example",
  role: "Example Partner Relations",
  email: "partners@example.com",
  copyLabel: "Copy address",
  copiedLabel: "Copied",
};

export default {
  component: JoinCta,
  variants: {
    default: {
      heading: "Become a partner",
      text: "Unlock new possibilities for collaboration.",
      points: [
        "Example point one",
        "Example point two, a little longer",
        "Example point three",
      ],
      buttonLabel: "Send inquiry",
      buttonHref: "#",
      contact,
      audiences,
    },
    "long-copy": {
      heading: "Become a strategic partner for the next Q-Summit conference",
      text: "Partnering with Q-Summit puts your brand in front of thousands of ambitious students, founders and investors across two days of keynotes, workshops and the partner expo, with tailored packages for every budget and goal.",
      points: [
        "A long example point that has to wrap onto a second line on a phone and maybe on a tablet",
      ],
      buttonLabel: "Talk to our partnerships team about your options",
      buttonHref: "#",
      contact: {
        ...contact,
        name: "Alexandra Example Placeholder",
        role: "Example Board Member Partner Relations and Corporate Outreach",
        email: "a.very.long.example.address@example.com",
      },
      audiences: audiences.map((entry) => ({
        ...entry,
        label: `${entry.label} looking for a long term partnership with Q-Summit`,
      })),
    },
    "no-audiences": {
      heading: "Become a Partner",
      text: "Unlock new possibilities for collaboration.",
      buttonLabel: "Inquire",
      buttonHref: "#",
      audiences: [],
    },
  },
};
