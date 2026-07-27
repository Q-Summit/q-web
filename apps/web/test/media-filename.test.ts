import { describe, expect, it } from "vitest";

import {
  resolvePhotoMediaKey,
  sanitize,
  variant,
} from "../src/lib/media-filename";

describe("resolvePhotoMediaKey", () => {
  it("prefers -p-800 when no local mirror exists", () => {
    const key = resolvePhotoMediaKey("Speaker Name.jpg");
    expect(key).toBe(variant("Speaker Name.jpg", "-p-800"));
    expect(key).toMatch(/-p-800\.jpg$/);
  });

  it("keeps an already-sized filename", () => {
    const key = resolvePhotoMediaKey("hero-shot-p-1600.jpg");
    expect(key).toBe(sanitize("hero-shot-p-1600.jpg"));
    expect(key).not.toMatch(/-p-1600-p-800/);
  });
});
