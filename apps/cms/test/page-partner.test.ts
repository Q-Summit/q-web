import { describe, expect, it } from "vitest";

import { requiredWithAudienceLabel } from "../src/globals/PagePartner";

// An audience is off until its title is filled, and then prints every one
// of its texts. The live Partners page was published before the audiences
// existed, so an empty audience must never block publishing it again.
describe("requiredWithAudienceLabel", () => {
  const off = { siblingData: { label: "" } };
  const on = { siblingData: { label: "Startups" } };

  it("asks for nothing while the audience has no title", () => {
    expect(requiredWithAudienceLabel("", off)).toBe(true);
    expect(requiredWithAudienceLabel(undefined, { siblingData: {} })).toBe(
      true,
    );
    expect(requiredWithAudienceLabel(null, { siblingData: undefined })).toBe(
      true,
    );
  });

  it("requires the text once the title is filled", () => {
    expect(requiredWithAudienceLabel("", on)).not.toBe(true);
    expect(requiredWithAudienceLabel("   ", on)).not.toBe(true);
    expect(requiredWithAudienceLabel("Write an email", on)).toBe(true);
  });
});
