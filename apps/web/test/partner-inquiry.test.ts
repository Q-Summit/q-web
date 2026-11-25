import { describe, expect, it } from "vitest";

import {
  TYPING,
  TYPING_ORDER,
  DEFAULT_TOPICS,
  INQUIRY_TOPICS,
  INQUIRY_TYPES,
  isValidEmail,
  inquirySummary,
  keystrokeDelay,
  topicLabel,
  typeLabel,
  parseInquiryType,
  topicsForType,
  validateInquiry,
  type InquiryValues,
} from "../src/lib/partner-inquiry";

const valid: InquiryValues = {
  type: "company",
  topics: [],
  name: "Jane Doe",
  email: "jane@example.com",
  message: "",
  consent: true,
};

describe("parseInquiryType", () => {
  it("selects a known type, ignoring case and spaces", () => {
    expect(parseInquiryType("media")).toBe("media");
    expect(parseInquiryType(" Company ")).toBe("company");
    expect(parseInquiryType("SPEAKER")).toBe("speaker");
    expect(parseInquiryType("initiative")).toBe("initiative");
  });

  it("selects nothing for missing or unknown values", () => {
    expect(parseInquiryType(null)).toBeNull();
    expect(parseInquiryType(undefined)).toBeNull();
    expect(parseInquiryType("")).toBeNull();
    expect(parseInquiryType("admin")).toBeNull();
    expect(parseInquiryType("company,media")).toBeNull();
    expect(parseInquiryType("startup")).toBeNull();
  });
});

describe("topics", () => {
  it("every configured topic key exists in the topic list", () => {
    const known = new Set(INQUIRY_TOPICS.map((topic) => topic.key));
    for (const type of INQUIRY_TYPES) {
      for (const key of type.topics) expect(known.has(key)).toBe(true);
    }
    for (const key of DEFAULT_TOPICS) expect(known.has(key)).toBe(true);
  });

  it("offers the four tiles of the design draft, in its order", () => {
    expect(INQUIRY_TYPES.map((type) => type.label)).toEqual([
      "Company",
      "Media",
      "Initiative",
      "Speaker",
    ]);
  });

  it("topic keys are unique", () => {
    const keys = INQUIRY_TOPICS.map((topic) => topic.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns the type's topics, or the default set without a type", () => {
    expect(topicsForType("media")).toEqual(INQUIRY_TYPES[1]?.topics);
    expect(topicsForType(null)).toBe(DEFAULT_TOPICS);
    expect(topicsForType("nonsense")).toBe(DEFAULT_TOPICS);
  });
});

describe("isValidEmail", () => {
  it("accepts ordinary work addresses", () => {
    expect(isValidEmail("jane@company.com")).toBe(true);
    expect(isValidEmail(" jane.doe+q@sub.company.de ")).toBe(true);
  });

  it("rejects typos", () => {
    expect(isValidEmail("jane")).toBe(false);
    expect(isValidEmail("jane@company")).toBe(false);
    expect(isValidEmail("jane@@company.com")).toBe(false);
    expect(isValidEmail("jane doe@company.com")).toBe(false);
    expect(isValidEmail("@company.com")).toBe(false);
  });
});

describe("validateInquiry", () => {
  it("accepts a complete inquiry with only the required fields", () => {
    expect(validateInquiry(valid)).toEqual({});
  });

  it("reports every missing required field in one pass", () => {
    const errors = validateInquiry({
      ...valid,
      type: "",
      name: "  ",
      email: "",
      consent: false,
    });
    expect(Object.keys(errors)).toEqual(["type", "name", "email", "consent"]);
  });

  it("tells a missing email from a malformed one", () => {
    expect(validateInquiry({ ...valid, email: "" }).email).toMatch(
      /Enter your/,
    );
    expect(validateInquiry({ ...valid, email: "jane@x" }).email).toMatch(
      /valid email/,
    );
  });

  it("does not require topics or message", () => {
    const errors = validateInquiry({
      ...valid,
      topics: [],
      message: "",
    });
    expect(errors).toEqual({});
  });

  it("rejects an unknown type value", () => {
    expect(validateInquiry({ ...valid, type: "admin" }).type).toBeDefined();
  });

  it("writes no em or en dashes into a message", () => {
    const errors = validateInquiry({
      type: "",
      topics: [],
      name: "",
      email: "x",
      message: "",
      consent: false,
    });
    for (const message of Object.values(errors)) {
      // Built from code points so this file stays free of the characters.
      const dashes = new RegExp(
        `[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`,
      );
      expect(message).not.toMatch(dashes);
    }
  });
});

describe("keystrokeDelay", () => {
  it("stays within the typist's spread around the mean", () => {
    const low = keystrokeDelay("a", 0);
    const high = keystrokeDelay("a", 1);
    expect(low).toBe(Math.round(TYPING.meanMs * (1 - TYPING.jitter)));
    expect(high).toBe(Math.round(TYPING.meanMs * (1 + TYPING.jitter)));
    expect(keystrokeDelay("a", 0.5)).toBe(TYPING.meanMs);
  });

  it("adds a beat after a space, a comma or a full stop", () => {
    for (const mark of [" ", ",", "."]) {
      expect(keystrokeDelay(mark, 0.5)).toBe(
        TYPING.meanMs + TYPING.wordPauseMs,
      );
    }
    expect(keystrokeDelay("a", 0.5)).toBe(TYPING.meanMs);
  });

  it("types at an ordinary speed, between 40 and 80 words a minute", () => {
    // five characters make a word
    const wordsPerMinute = 60_000 / TYPING.meanMs / 5;
    expect(wordsPerMinute).toBeGreaterThan(40);
    expect(wordsPerMinute).toBeLessThan(80);
  });

  it("types the fields in page order", () => {
    expect([...TYPING_ORDER]).toEqual(["name", "email", "message"]);
  });
});

describe("labels", () => {
  it("names the types and topics, and says nothing for an unknown key", () => {
    expect(typeLabel("company")).toBe("Company");
    expect(typeLabel("speaker")).toBe("Speaker");
    expect(typeLabel("nope")).toBe("");
    expect(topicLabel("coverage")).toBe("Coverage");
    expect(topicLabel("nope")).toBe("");
  });
});

describe("inquirySummary", () => {
  const base: InquiryValues = {
    type: "media",
    topics: ["visibility", "hackathon"],
    name: "Jane Doe",
    email: "jane@example.com",
    message: "Hello\nthere",
    consent: true,
  };

  it("lists what the visitor filled in, worded like the form", () => {
    expect(inquirySummary(base)).toEqual([
      { label: "You are reaching out as", value: "Media" },
      { label: "What matters most to you", value: "Visibility, Hackathon" },
      { label: "Full name", value: "Jane Doe" },
      { label: "Work email", value: "jane@example.com" },
      { label: "Anything we should know?", value: "Hello\nthere" },
    ]);
  });

  it("says so when an optional field was left empty", () => {
    const rows = inquirySummary({ ...base, topics: [], message: "" });
    expect(rows[1]?.value).toBe("None selected");
    expect(rows[4]?.value).toBe("Not given");
  });

  it("leaves out a topic it does not know", () => {
    const rows = inquirySummary({ ...base, topics: ["hackathon", "nope"] });
    expect(rows[1]?.value).toBe("Hackathon");
  });
});
