// VRT variants for HackSchedule. Covers the default four-item schedule,
// long descriptions that must wrap, and an empty schedule.
import HackSchedule from "./HackSchedule.astro";

export default {
  component: HackSchedule,
  variants: {
    default: {
      heading: "Schedule",
      intro: "Two days, from kickoff to the final pitches.",
      items: [
        {
          date: "Sat, 08:00",
          title: "Doors open and team check-in",
          description: "Grab your badge, find your table and meet your team.",
        },
        {
          date: "Sat, 10:00",
          title: "Opening keynote and challenge reveal",
          description: "Partner challenges go live and hacking begins.",
        },
        {
          date: "Sun, 09:00",
          title: "Submission deadline",
          description: "Push your final commit and upload your demo video.",
        },
        {
          date: "Sun, 14:00",
          title: "Final pitches and awards",
          description: "Top teams present on the main stage.",
        },
      ],
      images: [undefined, undefined, undefined, undefined],
    },
    "long-descriptions": {
      heading: "Full schedule",
      intro:
        "Every session, from the opening keynote to the closing awards ceremony, mapped out so you always know where to be.",
      items: [
        {
          date: "Sat, 08:00",
          title: "Doors open and team check-in",
          description:
            "Registration opens at the main entrance with coffee, breakfast and a quick badge scan, and mentors are already on the floor if you want to talk through an idea before the challenges are announced.",
        },
        {
          date: "Sat, 10:00",
          title: "Opening keynote and challenge reveal",
          description:
            "Partner companies take the stage one after another to present their challenge tracks and prize categories, and the full rules document goes live in the hacker portal immediately afterward.",
        },
      ],
      images: [undefined, undefined],
    },
    empty: {
      heading: "Schedule",
      intro: "The detailed agenda will be published closer to the event.",
      items: [],
      images: [],
    },
  },
};
