// VRT variants for the previous-speakers carousel. Covers the 5-speaker set
// the live homepage ships (see the component's own header comment), a long
// list, a single speaker (nav/dots hidden below total > 1), and a long bio
// that must clamp to 3 lines.
import SpeakerGrid from "./SpeakerGrid.astro";
import type { Speaker } from "../../lib/content";

const speaker = (
  name: string,
  roleLine: string,
  overrides: Partial<Speaker> = {},
): Speaker => ({
  name,
  role: "Speaker",
  company: null,
  roleLine,
  photoFilename: `speaker-${name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
  group: "previous",
  year: 2026,
  ...overrides,
});

const LONG_BIO =
  "Started her first company while still studying computer science, later scaled it to serve customers across twelve European markets before joining an early-stage venture fund to back the next wave of student founders full time.";

export default {
  component: SpeakerGrid,
  variants: {
    default: {
      heading: "Previous speakers",
      intro: "A look back at who has taken the stage at Q-Summit.",
      speakers: [
        speaker("Anna Keller", "Co-Founder of Northwind Capital", {
          bio: "Co-founded Northwind Capital after five years building payment infrastructure for European retailers.",
        }),
        speaker("David Marsh", "Director DACH & EMEA @Bluepeak Systems"),
        speaker("Priya Rao", "Founder of Rivertech Labs", {
          bio: "Built Rivertech Labs from a university side project into a twenty-person logistics startup.",
        }),
        speaker("Tobias Wagner", "Partner at Cedar Ventures"),
        speaker("Lena Fischer", "Head of Product at Solace Bank"),
      ],
      cta: { label: "See all speakers", href: "/speaker" },
    },
    "many-speakers": {
      heading: "Previous speakers",
      intro: "Twelve years of Q-Summit main stage guests.",
      speakers: Array.from({ length: 12 }, (_, i) =>
        speaker(`Speaker Number ${i + 1}`, "Founder and Q-Summit alumnus"),
      ),
      cta: { label: "See all speakers", href: "/speaker" },
    },
    "single-speaker": {
      heading: "Previous speakers",
      intro: "Only one highlight has been published so far.",
      speakers: [speaker("Anna Keller", "Co-Founder of Northwind Capital")],
      cta: undefined,
    },
    "long-bio": {
      heading: "Previous speakers",
      intro: "Long CMS bios must clamp instead of overflowing the card.",
      speakers: [
        speaker("Anna Keller", "Co-Founder of Northwind Capital", {
          bio: LONG_BIO,
        }),
        speaker("David Marsh", "Director DACH & EMEA @Bluepeak Systems", {
          bio: LONG_BIO,
        }),
      ],
      cta: undefined,
    },
  },
};
