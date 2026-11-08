import { describe, expect, it } from "vitest";

import {
  requirePlaceholders,
  TICKET_KEYS,
  TICKET_ROW_FIELDS,
  validateRowsMatchTierCount,
  validateUniqueTicketKeys,
} from "../src/globals/PageTickets";

// The 2026 archive (tiers / comparison / categories) keeps its positional
// guard: a tier added or removed without updating every row fails to save
// instead of storing a misaligned table.
describe("validateRowsMatchTierCount", () => {
  const tiers = [{ name: "A" }, { name: "B" }, { name: "C" }];

  function includedRow(count: number) {
    return {
      feature: "Feature",
      included: Array.from({ length: count }, () => ({ value: true })),
    };
  }

  it("passes when every row's included length equals the tier count", () => {
    const groups = [{ group: "Group", rows: [includedRow(3), includedRow(3)] }];
    expect(
      validateRowsMatchTierCount(groups, { siblingData: { tiers } } as never),
    ).toBe(true);
  });

  it("rejects a row with fewer included checkboxes than tiers, naming the row and group", () => {
    const groups = [{ group: "Access", rows: [includedRow(2)] }];
    const result = validateRowsMatchTierCount(groups, {
      siblingData: { tiers },
    } as never);
    expect(result).not.toBe(true);
    expect(String(result)).toMatch(/Feature/);
    expect(String(result)).toMatch(/Access/);
    expect(String(result)).toMatch(/2 included/);
    expect(String(result)).toMatch(/3 tiers/);
  });

  it("rejects a row with more included checkboxes than tiers", () => {
    const groups = [{ group: "Access", rows: [includedRow(4)] }];
    expect(
      validateRowsMatchTierCount(groups, { siblingData: { tiers } } as never),
    ).not.toBe(true);
  });

  it("skips the check when there are no tiers yet (tiers' own required validation covers it)", () => {
    const groups = [{ group: "Access", rows: [includedRow(2)] }];
    expect(
      validateRowsMatchTierCount(groups, {
        siblingData: { tiers: [] },
      } as never),
    ).toBe(true);
  });
});

// The 2027 model ties cards, What's included and Compare tickets together by
// ticket key, so a duplicate key would show one ticket's benefits under
// another's name.
describe("validateUniqueTicketKeys", () => {
  const run = (rows: unknown[]) =>
    validateUniqueTicketKeys(rows as never, {} as never);

  it("passes distinct keys", () => {
    expect(
      run([
        { key: "student", name: "Student" },
        { key: "start-up", name: "Start-Up" },
      ]),
    ).toBe(true);
  });

  it("rejects a key used twice, naming the ticket", () => {
    const result = run([
      { key: "student", name: "Student" },
      { key: "student", name: "Student again" },
    ]);
    expect(String(result)).toMatch(/Student again/);
  });

  it("needs at least two tickets for the compare view", () => {
    expect(run([{ key: "student", name: "Student" }])).not.toBe(true);
  });
});

describe("requirePlaceholders", () => {
  const validate = requirePlaceholders("included", "total");
  const run = (value: string | null) => validate(value as never, {} as never);

  it("passes a label that keeps every placeholder", () => {
    expect(run("{included} of {total} benefits included")).toBe(true);
  });

  it("names the placeholder that went missing", () => {
    expect(String(run("8 of {total} benefits"))).toContain("{included}");
  });

  it("rejects an empty label", () => {
    expect(run("")).not.toBe(true);
  });
});

// apps/web/src/lib/content/pages.ts TICKET_KEYS mirrors this list; the web
// build rejects any other key, so the two must change together.
describe("TICKET_KEYS", () => {
  it("lists the five 2027 categories in display order", () => {
    expect(TICKET_KEYS.map((k) => k.value)).toEqual([
      "student",
      "young-professional",
      "start-up",
      "investor",
      "corporate",
    ]);
  });
});

// Every category needs its own checkbox on each benefit row, and the field
// names must stay unique, or two categories would share one column.
describe("TICKET_ROW_FIELDS", () => {
  it("maps every ticket category to its own checkbox field", () => {
    const keys = TICKET_KEYS.map((k) => k.value);
    expect(Object.keys(TICKET_ROW_FIELDS).sort()).toEqual([...keys].sort());
    const fields = Object.values(TICKET_ROW_FIELDS);
    expect(new Set(fields).size).toBe(fields.length);
  });
});
