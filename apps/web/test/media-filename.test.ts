import { describe, expect, it } from "vitest";

import { resolvePhotoMediaKey } from "../src/lib/media-filename";

describe("resolvePhotoMediaKey", () => {
  it("uses the CMS/R2 filename when no local mirror exists", () => {
    const key = resolvePhotoMediaKey("Speaker Name.jpg");
    expect(key).toBe("Speaker Name.jpg");
    expect(key).not.toMatch(/-p-800/);
  });

  it("keeps an already-sized filename", () => {
    const key = resolvePhotoMediaKey("hero-shot-p-1600.jpg");
    expect(key).toBe("hero-shot-p-1600.jpg");
    expect(key).not.toMatch(/-p-1600-p-800/);
  });
});
