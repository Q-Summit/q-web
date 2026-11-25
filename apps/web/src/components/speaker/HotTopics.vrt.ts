// VRT variants for HotTopics. Covers the default layout (option 2, the
// sphere rising out of the card), the alternative option 8 (sphere inside
// the card, arrows beside it), and a long keyword that steps down a size.
// The sphere files are fixture sentinels, so only the layout is compared.
import HotTopics from "./HotTopics.astro";
import type { HotTopic } from "../../lib/content";

const topic = (
  keyword: string,
  overrides: Partial<HotTopic> = {},
): HotTopic => ({
  keyword,
  title: "Scaling to orbit",
  field: "Aviation, aerospace & defense",
  description:
    "Placeholder description for the gallery. Two or three sentences about the topic, about 250 characters, so the card shows its usual height.",
  imageFilename: "fixture-missing-sphere.webp",
  imageAlt: `Sphere for the topic ${keyword}`,
  ...overrides,
});

const topics = [
  topic("SPACE"),
  topic("BRANDS", {
    title: "Hype & habit",
    thumbFilename: "fixture-missing-thumb.webp",
  }),
  topic("[WORD 3]", { title: "Human out of the loop" }),
];

const copy = {
  label: "Hot topics 2027",
  heading: "Three topics set the 2027 main stage",
  intro: "The 2027 line-up is announced step by step.",
};

export default {
  component: HotTopics,
  variants: {
    default: { topics, ...copy },
    "option-8": { topics, ...copy, layout: "option8" },
    "long-keyword": {
      topics: [topic("SUSTAINABILITY", { title: "A long keyword" }), ...topics],
      ...copy,
    },
  },
};
