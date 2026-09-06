import { describe, expect, it } from "vitest";

import {
  ERSTI_QUIZ_QUESTIONS,
  STUDY_PROGRAMS,
  TEAM_ORDER,
} from "../src/components/kickoff/ersti-quiz.config";

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
