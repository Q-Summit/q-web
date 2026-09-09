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
        notionHref: "https://example.com/corporate",
      },
      { team: "Startup & VC", notionHref: "https://example.com/startup" },
      {
        team: "Speaker Relations",
        notionHref: "https://example.com/speaker",
      },
      {
        team: "Growth and Partnerships",
        notionHref: "https://example.com/growth",
      },
      { team: "IT", notionHref: "https://example.com/it" },
    ]);

    const hrefByTeam = Object.fromEntries(
      linked.map((result) => [result.team, result.notionHref]),
    );

    expect(hrefByTeam["Corporate"]).toBe("https://example.com/corporate");
    expect(hrefByTeam["Startup & Venture Capital"]).toBe(
      "https://example.com/startup",
    );
    expect(hrefByTeam["Speaker"]).toBe("https://example.com/speaker");
    expect(hrefByTeam["Growth & Partnerships"]).toBe(
      "https://example.com/growth",
    );
    expect(hrefByTeam["IT"]).toBe("https://example.com/it");
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
