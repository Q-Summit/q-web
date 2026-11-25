// VRT variants for SpeakerStage. Covers the default stage with talk and
// quote, a speaker without photo, talk or quote (silhouette, empty right
// screen), a long name and talk title that must clamp, and a single speaker
// (no arrows).
import SpeakerStage from "./SpeakerStage.astro";
import type { StageSpeaker } from "./SpeakerStage.astro";

const speaker = (overrides: Partial<StageSpeaker> = {}): StageSpeaker => ({
  name: "Elena Vasquez",
  role: "Co-Founder · Solaris Freight",
  talkTitle: "Why Europe needs its own rockets",
  quote:
    "We stopped asking for permission and started building the launch pads ourselves.",
  ...overrides,
});

const twenty = Array.from({ length: 20 }, (_, i) =>
  speaker({ name: `Speaker Name ${String(i + 1).padStart(2, "0")}` }),
);

export default {
  component: SpeakerStage,
  variants: {
    default: { speakers: [speaker(), ...twenty.slice(1)], edition: 2026 },
    "no-talk": {
      speakers: [
        speaker({ talkTitle: undefined, quote: undefined }),
        speaker(),
      ],
      edition: 2026,
    },
    "long-copy": {
      speakers: [
        speaker({
          name: "Maximilian von Falkenstein-Herrenberg",
          role: "Managing Partner and Head of Climate Investments · Solaris Freight Ventures",
          talkTitle:
            "A much longer talk title that runs well past forty-five characters on purpose",
        }),
        speaker(),
      ],
      edition: 2026,
    },
    single: { speakers: [speaker()], edition: 2026 },
  },
};
