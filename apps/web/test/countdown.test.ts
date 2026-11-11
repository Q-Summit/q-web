import { describe, expect, it } from "vitest";

import {
  EVENT_TIME_ZONE,
  remainingUntil,
  spokenRemaining,
  unitText,
  zonedDayStart,
} from "../src/lib/countdown";

describe("zonedDayStart", () => {
  it("starts the first conference day at midnight in Mannheim (summer time)", () => {
    // 1 April 2027 is CEST (UTC+2): the day begins at 22:00 UTC the day before.
    expect(zonedDayStart("2027-04-01", EVENT_TIME_ZONE)).toBe(
      Date.UTC(2027, 2, 31, 22, 0, 0),
    );
  });

  it("uses winter time for a winter date", () => {
    // CET (UTC+1).
    expect(zonedDayStart("2027-01-15", EVENT_TIME_ZONE)).toBe(
      Date.UTC(2027, 0, 14, 23, 0, 0),
    );
  });

  it("handles the days the clocks change", () => {
    // Clocks go forward on 28 March 2027 at 02:00; midnight is still CET.
    expect(zonedDayStart("2027-03-28", EVENT_TIME_ZONE)).toBe(
      Date.UTC(2027, 2, 27, 23, 0, 0),
    );
    // The day after is CEST.
    expect(zonedDayStart("2027-03-29", EVENT_TIME_ZONE)).toBe(
      Date.UTC(2027, 2, 28, 22, 0, 0),
    );
    // Clocks go back on 31 October 2027 at 03:00; midnight is still CEST.
    expect(zonedDayStart("2027-10-31", EVENT_TIME_ZONE)).toBe(
      Date.UTC(2027, 9, 30, 22, 0, 0),
    );
  });

  it("does not depend on the zone the build runs in", () => {
    expect(zonedDayStart("2027-04-01", "UTC")).toBe(Date.UTC(2027, 3, 1));
    expect(zonedDayStart("2027-04-01", "America/Los_Angeles")).toBe(
      Date.UTC(2027, 3, 1, 7),
    );
  });

  it("rejects something that is not an ISO day", () => {
    expect(() => zonedDayStart("April 1", EVENT_TIME_ZONE)).toThrow(/ISO day/);
  });
});

describe("remainingUntil", () => {
  const target = Date.UTC(2027, 2, 31, 22);

  it("splits the time left into whole units", () => {
    const now = target - (142 * 86_400 + 12 * 3600 + 14 * 60 + 9) * 1000;
    expect(remainingUntil(target, now)).toEqual({
      days: 142,
      hours: 12,
      minutes: 14,
      seconds: 9,
      done: false,
    });
  });

  it("never shows a unit that has not fully passed", () => {
    expect(remainingUntil(target, target - 999)).toMatchObject({
      seconds: 0,
      done: false,
    });
    expect(remainingUntil(target, target - 1000)).toMatchObject({ seconds: 1 });
  });

  it("stops at zero, at the target and after it", () => {
    for (const now of [target, target + 5000, target + 86_400_000]) {
      expect(remainingUntil(target, now)).toEqual({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        done: true,
      });
    }
  });
});

describe("spokenRemaining", () => {
  it("fills the sentence read out instead of the digits", () => {
    expect(
      spokenRemaining("{days} days, {hours} hours and {minutes} minutes left", {
        days: 3,
        hours: 4,
        minutes: 5,
        seconds: 6,
        done: false,
      }),
    ).toBe("3 days, 4 hours and 5 minutes left");
  });
});

describe("figures of a unit", () => {
  it("always shows two digits, and as many as the days need", () => {
    const left = { days: 142, hours: 3, minutes: 0, seconds: 59, done: false };
    expect(unitText("days", left)).toBe("142");
    expect(unitText("hours", left)).toBe("03");
    expect(unitText("minutes", left)).toBe("00");
    expect(unitText("seconds", left)).toBe("59");
    expect(unitText("days", { ...left, days: 7 })).toBe("07");
  });
});
