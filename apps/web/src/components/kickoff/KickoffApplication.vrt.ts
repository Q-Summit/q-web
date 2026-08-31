// VRT variants for KickoffApplication. Timeline ships without photos
// (images=[]). Covers a short flow, long copy, and an empty list.
import KickoffApplication from "./KickoffApplication.astro";

export default {
  component: KickoffApplication,
  variants: {
    default: {
      content: {
        eyebrow: "How to join",
        heading: "Application flow",
        intro: "Four steps from the quiz to your first team meeting.",
        isOpen: false,
        applicationUrl: "",
        comingSoonLabel: "Coming Soon",
        steps: [
          {
            date: "Week 1",
            title: "Take the quiz",
            text: "Find the teams whose work matches how you like to spend a Sunday.",
          },
          {
            date: "Week 2",
            title: "Send the form",
            text: "The application opens after kickoff. One form covers every team.",
          },
          {
            date: "Week 3",
            title: "Meet the leads",
            text: "Short conversations, no case study. We want to know how you work.",
          },
          {
            date: "Week 4",
            title: "First team night",
            text: "You pick a team and join the next planning session.",
          },
        ],
      },
    },
    "long-copy": {
      content: {
        eyebrow: "How to join",
        heading: "From quiz to first meeting",
        intro:
          "The flow stays the same every year: a short quiz, one form, a conversation with the leads, then a first evening with the team you chose.",
        isOpen: false,
        applicationUrl: "",
        comingSoonLabel: "Coming Soon",
        steps: [
          {
            date: "After kickoff",
            title: "The form goes live",
            text: "We open applications only once the kickoff panel is done, so everyone who heard the same brief fills in the same form.",
          },
          {
            date: "The week after",
            title: "Conversations with leads",
            text: "Each team lead reads the answers that tagged their work and books a short call. No slides, no homework, just how you like to work.",
          },
        ],
      },
    },
    empty: {
      content: {
        eyebrow: "How to join",
        heading: "Application flow",
        intro: "Dates land here once the next cycle is set.",
        isOpen: false,
        applicationUrl: "",
        comingSoonLabel: "Coming Soon",
        steps: [],
      },
    },
  },
};
