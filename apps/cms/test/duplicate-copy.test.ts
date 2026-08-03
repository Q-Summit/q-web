import type { FieldHook } from "payload";
import { describe, expect, it } from "vitest";

import {
  copyLabelOnDuplicate,
  copySlugOnDuplicate,
} from "../src/lib/duplicate-copy";

type HookArgs = Parameters<FieldHook>[0];

const run = (hook: FieldHook, value: unknown) =>
  hook({ value } as unknown as HookArgs);

// The regex jobs.slug validates with; the renamed slug must keep passing it.
const JOBS_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("duplicate-copy beforeDuplicate hooks", () => {
  it("renames a label so compound-key collections can duplicate", () => {
    expect(run(copyLabelOnDuplicate, "Jane Doe")).toBe("Jane Doe (copy)");
    expect(run(copyLabelOnDuplicate, "Why attend?")).toBe(
      "Why attend? (copy)",
    );
  });

  it("renames a slug within the kebab-case validate rule", () => {
    const renamed = run(copySlugOnDuplicate, "acme-working-student");
    expect(renamed).toBe("acme-working-student-copy");
    expect(String(renamed)).toMatch(JOBS_SLUG_RE);
  });

  it("passes empty and non-string values through untouched", () => {
    expect(run(copyLabelOnDuplicate, "")).toBe("");
    expect(run(copyLabelOnDuplicate, undefined)).toBeUndefined();
    expect(run(copySlugOnDuplicate, "   ")).toBe("   ");
    expect(run(copySlugOnDuplicate, null)).toBeNull();
  });
});
