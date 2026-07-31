// VRT variants for BenefitCards. Content stresses the card grid the way real
// CMS data will: the default six-card set, a long-copy card that must wrap,
// and a short set with fewer cards than icons. See
// docs/dev/visual-testing.md for the variant conventions.
import BenefitCards from "./BenefitCards.astro";

export default {
  component: BenefitCards,
  variants: {
    default: {
      heading: "Why Q-Hackathon isn't just another hackathon",
      cards: [
        { title: "Real prizes", description: "Win cash and cloud credits." },
        {
          title: "Expert mentors",
          description: "Get hands-on help from industry engineers.",
        },
        {
          title: "Bold ideas",
          description: "Build something you would never ship at work.",
        },
        {
          title: "Stage time",
          description: "Pitch your project to the whole conference floor.",
        },
        {
          title: "Community",
          description: "Meet hundreds of builders across two intense days.",
        },
        {
          title: "Free entry",
          description: "No ticket cost, food and drinks included.",
        },
      ],
    },
    "long-copy": {
      heading: "What makes this weekend worth clearing your calendar for",
      cards: [
        {
          title: "Mentors who have shipped production systems at scale",
          description:
            "Our mentor pool is pulled from partner engineering teams who have built payment systems, developer tools and machine learning platforms used by millions of people, and they stay on site for the full 24 hours to unblock your team.",
        },
        {
          title: "Prize categories that reward more than the flashiest demo",
          description:
            "Alongside the grand prize, sponsors run tracks for best use of their API, best beginner project and most creative use of on-device hardware, so first-time hackers have a real shot at winning something.",
        },
      ],
    },
    few: {
      heading: "Two reasons to sign up",
      cards: [
        { title: "It's free", description: "Food, drinks and swag included." },
        { title: "It's fast", description: "One weekend, one working demo." },
      ],
    },
  },
};
