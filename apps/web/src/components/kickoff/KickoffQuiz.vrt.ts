// VRT variants for KickoffQuiz. Screenshots capture the start panel (the
// default SSR state). Questions and results are client-rendered after
// click, so they are not in the baseline. See docs/dev/visual-testing.md.
import KickoffQuiz from "./KickoffQuiz.astro";

const quiz = {
  eyebrow: "Team quiz",
  heading: "Which team fits how you work?",
  intro: "Five short questions. Your top three teams show at the end.",
  ui: {
    questionLabel: "Question",
    ofLabel: "of",
    backLabel: "Back",
    nextLabel: "Next",
    showResultLabel: "Show result",
    placeLabel: "Place",
    teamLinkLabel: "Open team page",
  },
  start: {
    eyebrow: "Two minutes",
    heading: "Find your Q team",
    copy: "Answer a few questions. We tally the tags and show your top three teams.",
    buttonLabel: "Start the quiz",
  },
  questions: [
    {
      kicker: "A new project",
      question: "How do you like to start?",
      answers: [
        {
          id: "A",
          text: "Write the plan first.",
          tags: ["Concept"],
        },
        {
          id: "B",
          text: "Talk to people and see what sticks.",
          tags: ["PR"],
        },
      ],
    },
  ],
  results: [
    {
      team: "Concept",
      text: "You like structure and a clear brief.",
      notionHref: "#teams",
    },
    {
      team: "PR",
      text: "You like telling the story out loud.",
      notionHref: "#teams",
    },
  ],
  resultCopy: {
    eyebrow: "Your match",
    heading: "These teams fit you",
    copy: "Read the top three, then apply when the form opens.",
    restartLabel: "Try again",
    applicationCta: { label: "Apply now", href: "#application-flow" },
    allTeamsCta: { label: "See every team", href: "#teams" },
  },
};

export default {
  component: KickoffQuiz,
  variants: {
    default: {
      quiz,
      isOpen: false,
      applicationUrl: "",
      comingSoonLabel: "Coming Soon",
    },
    "applications-open": {
      quiz,
      isOpen: true,
      applicationUrl: "https://example.com/apply",
      comingSoonLabel: "Coming Soon",
    },
  },
};
