// VRT variants for the home speaker highlights: past speakers alone, past
// speakers plus a partly filled lineup with placeholders (local review),
// the same lineup without placeholders (what a live build shows), and long
// names and roles. Photos are sample filenames that do not exist, so the
// cards show their light ground. See docs/dev/visual-testing.md.
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
  group: "panel",
  year: null,
  ...overrides,
});

const alumni = [
  speaker("Anna Keller", "Co-Founder of Northwind Capital"),
  speaker("David Marsh", "Director DACH & EMEA @Bluepeak Systems"),
  speaker("Priya Rao", "Founder of Rivertech Labs"),
  speaker("Tobias Wagner", "Partner at Cedar Ventures"),
];

const lineup = [
  speaker("Sample Speaker", "Sample role, Sample company", {
    group: "current",
    year: 2027,
  }),
];

const base = {
  eyebrow: "Sample eyebrow",
  heading: "Sample speaker highlights",
  cta: { label: "See all sample speakers", href: "#speakers" },
  alumni,
  alumniLabel: "Sample alumni",
};

export default {
  component: SpeakerGrid,
  variants: {
    default: base,
    "lineup-with-placeholders": {
      ...base,
      lineup,
      lineupLabel: "2027",
      lineupSlots: 4,
      placeholders: true,
      placeholderName: "Sample placeholder",
      placeholderRole: "Placeholder, sample only",
    },
    "lineup-live": {
      ...base,
      lineup,
      lineupLabel: "2027",
      lineupSlots: 4,
      placeholders: false,
    },
    "long-names": {
      ...base,
      alumni: [
        speaker(
          "Dr. Maximiliane Alexandra von Hohenberg-Sample",
          "Managing Director and Chief Sample Officer, Sample Holdings International",
        ),
        ...alumni.slice(0, 2),
      ],
    },
    empty: {
      heading: "No speakers",
      cta: undefined,
      alumni: [],
    },
  },
};
