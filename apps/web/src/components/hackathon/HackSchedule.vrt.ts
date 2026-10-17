// VRT variants for HackSchedule. Covers the default four-item schedule,
// long descriptions that must wrap, an empty schedule, and look-back photos
// beside rows (static render: the LED strip shows fully lit).
import HackSchedule from "./HackSchedule.astro";
import { pastPhotos } from "../../assets/media/hackathon";

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
    },
    empty: {
      heading: "Schedule",
      intro: "The detailed agenda will be published closer to the event.",
      items: [],
    },
    "with-photos": {
      heading: "Schedule",
      intro: "One day, from check-in to the prize ceremony.",
      items: [
        { date: "10:00", title: "Check-in", description: "" },
        { date: "10:30", title: "Welcome and orientation", description: "" },
        { date: "11:00", title: "Hacking starts", description: "" },
        { date: "13:00", title: "Lunch break", description: "" },
      ],
      photos: { 0: pastPhotos.hallProjection, 2: pastPhotos.laptopWork },
    },
  },
};
