import { describe, expect, it } from "vitest";

import { cssTimeMs } from "../src/lib/motion/css-time";

// The production build minifies CSS times (150ms -> .15s) while the dev
// server keeps them as written. Glass motion timed itself with parseFloat
// and ran 1000x too fast in production only; both spellings must read the
// same.
describe("cssTimeMs", () => {
  it("reads milliseconds as written in tokens.css", () => {
    expect(cssTimeMs("150ms", 0)).toBe(150);
    expect(cssTimeMs(" 380ms ", 0)).toBe(380);
  });

  it("reads the minified seconds form the build emits", () => {
    expect(cssTimeMs(".15s", 0)).toBeCloseTo(150);
    expect(cssTimeMs("0.38s", 0)).toBeCloseTo(380);
    expect(cssTimeMs("1s", 0)).toBe(1000);
  });

  it("falls back for empty or unitless values", () => {
    expect(cssTimeMs("", 220)).toBe(220);
    expect(cssTimeMs("abc", 220)).toBe(220);
    expect(cssTimeMs("150", 220)).toBe(220);
  });
});
