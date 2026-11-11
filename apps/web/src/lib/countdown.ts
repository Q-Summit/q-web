/**
 * Countdown math of the home hero
 * (DESIGN.md HOME-1). Pure functions, shared by the build (target instant,
 * first paint) and the browser (countdown.client.ts), and unit tested.
 */

/** The conference runs on Mannheim time, whatever the visitor's clock says. */
export const EVENT_TIME_ZONE = "Europe/Berlin";

/**
 * The instant (epoch ms) at which `isoDay` (yyyy-mm-dd) begins in
 * `timeZone`. Daylight saving is the zone's own: 2027-04-01 in Berlin is
 * UTC+2, so the day begins at 2027-03-31T22:00:00Z.
 */
export function zonedDayStart(isoDay: string, timeZone: string): number {
  const [year, month, day] = isoDay.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`[countdown] not an ISO day (yyyy-mm-dd): "${isoDay}"`);
  }
  const wallClock = Date.UTC(year, month - 1, day);
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  // How far the zone's wall clock is ahead of UTC at instant t.
  const offsetAt = (t: number): number => {
    const part = (type: string) =>
      Number(
        format.formatToParts(new Date(t)).find((p) => p.type === type)!.value,
      );
    return (
      Date.UTC(
        part("year"),
        part("month") - 1,
        part("day"),
        part("hour"),
        part("minute"),
        part("second"),
      ) - t
    );
  };
  // Second pass: the first guess can sit on the other side of a clock change.
  const first = wallClock - offsetAt(wallClock);
  return wallClock - offsetAt(first);
}

export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** The target has been reached; every unit is 0. */
  done: boolean;
}

/** Whole days, hours, minutes and seconds left until `target`. */
export function remainingUntil(target: number, now: number): Remaining {
  const left = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(left / 86_400),
    hours: Math.floor((left % 86_400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
    done: target - now <= 0,
  };
}

/** Fills {days}, {hours} and {minutes} in the sentence read out instead of the digits. */
export function spokenRemaining(template: string, left: Remaining): string {
  return template
    .replaceAll("{days}", String(left.days))
    .replaceAll("{hours}", String(left.hours))
    .replaceAll("{minutes}", String(left.minutes));
}

export const COUNTDOWN_UNITS = ["days", "hours", "minutes", "seconds"] as const;
export type CountdownUnit = (typeof COUNTDOWN_UNITS)[number];

/** Days grow to as many digits as they need; the other units always show two. */
export function unitText(unit: CountdownUnit, left: Remaining): string {
  return String(left[unit]).padStart(2, "0");
}
