import { describe, expect, it } from "vitest";

import { validateRowsMatchTierCount } from "../src/globals/PageTickets";

// PricingComparisonTable.astro renders one <th> per comparison.tiers entry
// and one <td> per row.included entry with no length check between the two
// (finding: web-quality). Guard the CMS side so a tier added/removed without
// updating every existing row fails to save instead of silently shifting
// columns under the wrong header on the live site.
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
