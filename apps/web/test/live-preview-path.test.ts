import { describe, expect, it } from "vitest";

// Mirror of path resolution used by live-preview/client.ts (kept light so
// the browser client stays dependency-free of this test module).
function getPath(data: unknown, path: string): unknown {
  if (!path) return data;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, data);
}

describe("live-preview path resolution", () => {
  it("reads nested Payload global fields", () => {
    const doc = {
      hero: { headline: "Hello", cta: { label: "Go", href: "/x" } },
      stats: { items: [{ value: "1500", label: "Participants" }] },
    };
    expect(getPath(doc, "hero.headline")).toBe("Hello");
    expect(getPath(doc, "hero.cta.label")).toBe("Go");
    expect(getPath(doc, "stats.items")).toEqual([
      { value: "1500", label: "Participants" },
    ]);
  });
});
