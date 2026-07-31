// VRT variants for FeatureSection. Covers the default two-column layout
// with items, the itemless solo-photo layout, and long copy that must wrap
// in the grid text column.
import FeatureSection from "./FeatureSection.astro";

export default {
  component: FeatureSection,
  variants: {
    default: {
      id: "attendees",
      heading: "Why students attend",
      paragraph:
        "Q-Summit connects ambitious students with the founders, investors and companies shaping the next generation of startups.",
      items: [
        {
          title: "Talent",
          description:
            "Meet recruiters and founders hiring for internships and graduate roles.",
        },
        {
          title: "Trends",
          description:
            "Hear where the market is heading from the people building it.",
        },
      ],
      image: {
        base: "/media/whyq-attendees",
        ext: "webp",
        width: 800,
        height: 600,
        alt: "Students talking with founders at the Q-Summit expo",
      },
    },
    "long-copy": {
      id: "founders",
      heading: "Why founders attend",
      paragraph:
        "Founders come to Q-Summit to meet the students who will become their earliest hires, their co-founders, and in some cases their first customers, all in the same two days.",
      items: [
        {
          title: "Hiring",
          description:
            "Run structured interviews on site with hundreds of students who have already read your pitch and applied ahead of the conference.",
        },
        {
          title: "Visibility",
          description:
            "Present on the main stage or in a workshop to an audience that actively wants to work at or found a startup.",
        },
      ],
      imageLeft: true,
      image: {
        base: "/media/whyq-founders",
        ext: "webp",
        width: 800,
        height: 600,
        alt: "A founder presenting on the Q-Summit main stage",
      },
    },
    "no-items": {
      id: "investors",
      heading: "Why investors attend",
      paragraph:
        "Investors use Q-Summit to scout the founding teams and student talent entering the market before anyone else does.",
      image: {
        base: "/media/whyq-investors",
        ext: "webp",
        width: 800,
        height: 600,
        alt: "Investors reviewing pitch decks at Q-Summit",
      },
    },
  },
};
