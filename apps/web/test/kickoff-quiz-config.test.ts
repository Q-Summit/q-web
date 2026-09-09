import { describe, expect, it } from "vitest";

import {
  ERSTI_QUIZ_QUESTIONS,
  ERSTI_QUIZ_RESULTS,
  STUDY_PROGRAMS,
  TEAM_ORDER,
} from "../src/components/kickoff/ersti-quiz.config";
import { attachQuizTeamLinks } from "../src/components/kickoff/quiz-team-links";

describe("Ersti quiz blueprint", () => {
  it("has exactly eight matching questions with five answers each", () => {
    expect(ERSTI_QUIZ_QUESTIONS).toHaveLength(8);
    for (const question of ERSTI_QUIZ_QUESTIONS) {
      expect(question.answers).toHaveLength(5);
    }
  });

  it("gives every team the same theoretical maximum of 20 points", () => {
    const maxima = new Map(TEAM_ORDER.map((team) => [team, 0]));

    for (const question of ERSTI_QUIZ_QUESTIONS) {
      for (const team of TEAM_ORDER) {
        const bestForQuestion = Math.max(
          0,
          ...question.answers.flatMap((answer) =>
            answer.matches
              .filter((match) => match.team === team)
              .map((match) => match.points),
          ),
        );
        maxima.set(team, (maxima.get(team) ?? 0) + bestForQuestion);
      }
    }

    expect(Object.fromEntries(maxima)).toEqual(
      Object.fromEntries(TEAM_ORDER.map((team) => [team, 20])),
    );
  });

  it("includes a broad Mannheim study-program list and common aliases", () => {
    expect(STUDY_PROGRAMS.length).toBeGreaterThanOrEqual(70);
    expect(
      STUDY_PROGRAMS.some((program) =>
        program.aliases.some((alias) => alias.toLowerCase() === "wifo"),
      ),
    ).toBe(true);
    expect(
      STUDY_PROGRAMS.some((program) =>
        program.aliases.some((alias) => alias.toLowerCase() === "bwl"),
      ),
    ).toBe(true);
  });
});

describe("attachQuizTeamLinks", () => {
  it("maps CMS team labels onto the quiz result names used on the site", () => {
    const linked = attachQuizTeamLinks(ERSTI_QUIZ_RESULTS, [
      {
        team: "Corporate Relations",
        notionHref:
          "https://app.notion.com/p/q-summit/Corporate-36a024b9b73b8079baebf35fcfd4071b",
      },
      {
        team: "Startup & VC",
        notionHref:
          "https://app.notion.com/p/q-summit/Startup-Venture-Capital-36a024b9b73b80ffa241cb931865b90d",
      },
      {
        team: "Speaker Relations",
        notionHref:
          "https://app.notion.com/p/q-summit/Speaker-36a024b9b73b8073a02ce26b50ff09c7",
      },
      {
        team: "Growth and Partnerships",
        notionHref:
          "https://app.notion.com/p/q-summit/Growth-Partnerships-36a024b9b73b80adb258ec1572bd82b4",
      },
      {
        team: "IT",
        notionHref:
          "https://app.notion.com/p/q-summit/IT-36a024b9b73b80449e52fd505019d46c",
      },
    ]);

    const hrefByTeam = Object.fromEntries(
      linked.map((result) => [result.team, result.notionHref]),
    );

    expect(hrefByTeam["Corporate"]).toContain("/Corporate-");
    expect(hrefByTeam["Startup & Venture Capital"]).toContain(
      "/Startup-Venture-Capital-",
    );
    expect(hrefByTeam["Speaker"]).toContain("/Speaker-");
    expect(hrefByTeam["Growth & Partnerships"]).toContain(
      "/Growth-Partnerships-",
    );
    expect(hrefByTeam["IT"]).toContain("/IT-");
    expect(hrefByTeam["Hackathon"]).toBe("");
  });

  it("covers every quiz team when CMS rows use the published labels", () => {
    const linked = attachQuizTeamLinks(ERSTI_QUIZ_RESULTS, [
      {
        team: "Corporate Relations",
        notionHref: "https://example.com/corporate",
      },
      { team: "Startup & VC", notionHref: "https://example.com/startup" },
      { team: "Speaker Relations", notionHref: "https://example.com/speaker" },
      {
        team: "Human Capital & Foreign Relations",
        notionHref: "https://example.com/hc",
      },
      { team: "Hackathon", notionHref: "https://example.com/hack" },
      { team: "Female Founders", notionHref: "https://example.com/ff" },
      { team: "Concept", notionHref: "https://example.com/concept" },
      { team: "On Conference", notionHref: "https://example.com/oncon" },
      {
        team: "Participant Relations",
        notionHref: "https://example.com/pr",
      },
      { team: "Marketing", notionHref: "https://example.com/mkt" },
      {
        team: "Growth and Partnerships",
        notionHref: "https://example.com/gp",
      },
      { team: "IT", notionHref: "https://example.com/it" },
    ]);

    expect(linked.map((result) => result.team)).toEqual([...TEAM_ORDER]);
    expect(
      linked.every((result) => result.notionHref?.startsWith("https://")),
    ).toBe(true);
  });
});
