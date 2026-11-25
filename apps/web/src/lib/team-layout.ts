/*
 * Row layout of the current-team page (components/team/TeamPanels.astro):
 * a pure helper, kept apart from lib/team.ts so it can be unit tested
 * without the image pipeline.
 */
import type { TeamMember } from "./content";

/** One title group on the current-team page: people who share a title
 * stand together under one label. */
export interface TitleGroup {
  role: string;
  members: TeamMember[];
  /** The division's first member (its board member or chair). */
  lead: boolean;
}

/**
 * Lays a division out in rows of at most `cap` members: every title is one
 * group that is never split (unless it alone is wider than a row, then it
 * is cut into row-sized parts, each with its title), the division's first
 * member (the board member or chair) leads with a group of their own, and
 * the groups are packed in order into full rows: each row starts with the
 * next group and takes any later group that still fits, so a single
 * person moves up next to the board member.
 */
export function packDivision(
  members: TeamMember[],
  cap: number,
): TitleGroup[][] {
  const LEAD = Symbol("lead");
  const byTitle = new Map<string | typeof LEAD, TeamMember[]>();
  members.forEach((member, i) => {
    const key = i === 0 ? LEAD : member.role;
    const list = byTitle.get(key) ?? [];
    list.push(member);
    byTitle.set(key, list);
  });

  const parts: TitleGroup[] = [];
  for (const [key, list] of byTitle) {
    for (let i = 0; i < list.length; i += cap) {
      parts.push({
        role: list[0].role,
        members: list.slice(i, i + cap),
        lead: key === LEAD,
      });
    }
  }

  const rows: TitleGroup[][] = [];
  while (parts.length > 0) {
    const row = [parts.shift()!];
    let filled = row[0].members.length;
    for (let i = 0; i < parts.length && filled < cap;) {
      if (filled + parts[i].members.length <= cap) {
        filled += parts[i].members.length;
        row.push(parts.splice(i, 1)[0]);
      } else {
        i += 1;
      }
    }
    rows.push(row);
  }
  return rows;
}
