import { describe, expect, it } from "vitest";

import {
  matchMediaFilename,
  normalizeLooseFilename,
  stripSizeSuffix,
} from "../src/lib/media-match";

describe("stripSizeSuffix", () => {
  it("strips Webflow -p-<n> suffixes", () => {
    expect(stripSizeSuffix("photo-p-800.webp")).toBe("photo.webp");
  });

  it("strips bare size suffixes", () => {
    expect(stripSizeSuffix("whyq-attendees-800.webp")).toBe(
      "whyq-attendees.webp",
    );
  });
});

describe("normalizeLooseFilename", () => {
  it("folds diacritics and separators", () => {
    expect(normalizeLooseFilename("Axel_Täubert-Photo.jpg")).toBe(
      "axeltaubertphoto",
    );
  });
});

describe("matchMediaFilename", () => {
  const files = [
    "speaker-p-800.webp",
    "Axel_Taubert-p-800.webp",
    "jonas1.webp",
    "jonas.webp",
  ];

  it("matches exact basenames", () => {
    expect(matchMediaFilename("jonas.webp", files)).toEqual({
      file: "jonas.webp",
      kind: "exact",
    });
  });

  it("matches via size suffix strip", () => {
    expect(matchMediaFilename("speaker.webp", files)).toEqual({
      file: "speaker-p-800.webp",
      kind: "stripped",
    });
  });

  it("matches normalized diacritic forms", () => {
    expect(matchMediaFilename("Axel_Täubert.webp", files)?.file).toBe(
      "Axel_Taubert-p-800.webp",
    );
    expect(matchMediaFilename("Axel_Täubert.webp", files)?.kind).toBe(
      "normalized",
    );
  });

  it("falls back to substring with a warning-worthy kind", () => {
    expect(matchMediaFilename("jonas1x", files)?.kind).toBe("substring");
    expect(matchMediaFilename("jonas1x", files)?.file).toBe("jonas1.webp");
  });

  it("returns undefined when nothing matches", () => {
    expect(matchMediaFilename("missing.webp", files)).toBeUndefined();
  });
});
