import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { NAV_GROUP_ORDER } from "../src/lib/nav-groups";

const SRC = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src",
);

/*
 * The custom Nav (src/components/nav.tsx) sorts groups by NAV_GROUP_ORDER and
 * appends anything it does not recognize. That is a safe default but a silent
 * one: a new collection or global with a fresh `group:` string would land at
 * the bottom of the sidebar and nobody would notice in review. This reads the
 * group names straight out of the configs and fails if one is unlisted.
 */

function groupNamesIn(dir: string): string[] {
  const names = new Set<string>();
  for (const file of readdirSync(path.join(SRC, dir))) {
    if (!file.endsWith(".ts")) continue;
    const source = readFileSync(path.join(SRC, dir, file), "utf8");
    for (const match of source.matchAll(/\bgroup:\s*"([^"]+)"/g)) {
      names.add(match[1]);
    }
    // draftCollection() defaults to this when a collection passes no group.
    for (const match of source.matchAll(/adminGroup\s*\?\?\s*"([^"]+)"/g)) {
      names.add(match[1]);
    }
  }
  return [...names];
}

describe("nav group order", () => {
  it("knows every admin group used by a collection or global", () => {
    const used = [
      ...groupNamesIn("collections"),
      ...groupNamesIn("globals"),
    ].sort();

    expect(used.length).toBeGreaterThan(0);
    for (const name of used) {
      expect(
        NAV_GROUP_ORDER as readonly string[],
        `admin group "${name}" is not in NAV_GROUP_ORDER, so it would sort to the bottom of the sidebar`,
      ).toContain(name);
    }
  });

  it("puts Website pages first, above the collections", () => {
    expect(NAV_GROUP_ORDER[0]).toBe("Website pages");
    expect(NAV_GROUP_ORDER.indexOf("Website pages")).toBeLessThan(
      NAV_GROUP_ORDER.indexOf("Lists & people"),
    );
  });

  it("has no duplicate entries", () => {
    expect(new Set(NAV_GROUP_ORDER).size).toBe(NAV_GROUP_ORDER.length);
  });
});
