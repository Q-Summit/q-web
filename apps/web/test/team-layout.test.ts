// The current-team page packs each division's title groups into rows of
// 4 (laptops), 3 (tablets) or 2 (phones): a title group is never split
// unless it alone is wider than a row, and a single member moves up next
// to the board member.
import { describe, expect, it } from "vitest";

import type { TeamMember } from "../src/lib/content";
import { packDivision } from "../src/lib/team-layout";

const m = (name: string, role: string): TeamMember => ({
  name,
  role,
  division: "Fixture",
  photoFilename: `${name}.jpg`,
  year: "2027",
});

const shape = (rows: ReturnType<typeof packDivision>) =>
  rows.map((row) =>
    row.map((group) => `${group.role}:${group.members.length}`),
  );

// The shape of a real division: a chair, a trio, two pairs, a single.
const chair = [
  m("A", "Chair"),
  m("B", "Hackathon"),
  m("C", "Hackathon"),
  m("D", "Hackathon"),
  m("E", "Human Capital"),
  m("F", "Human Capital"),
  m("G", "Female Founders"),
];

describe("packDivision", () => {
  it("fills rows of four and keeps every title together", () => {
    expect(shape(packDivision(chair, 4))).toEqual([
      ["Chair:1", "Hackathon:3"],
      ["Human Capital:2", "Female Founders:1"],
    ]);
  });

  it("moves a single member up next to the lead on rows of three", () => {
    expect(shape(packDivision(chair, 3))).toEqual([
      ["Chair:1", "Human Capital:2"],
      ["Hackathon:3"],
      ["Female Founders:1"],
    ]);
  });

  it("cuts a title group wider than a row into row-sized parts", () => {
    expect(shape(packDivision(chair, 2))).toEqual([
      ["Chair:1", "Hackathon:1"],
      ["Hackathon:2"],
      ["Human Capital:2"],
      ["Female Founders:1"],
    ]);
  });

  it("marks only the first member's group as the lead", () => {
    const rows = packDivision([m("A", "Head"), m("B", "Head")], 4);
    expect(rows).toHaveLength(1);
    expect(rows[0].map((group) => group.lead)).toEqual([true, false]);
  });

  it("returns no rows for an empty division", () => {
    expect(packDivision([], 4)).toEqual([]);
  });
});
