/**
 * Partner inquiry form (DESIGN.md INQUIRY-1): route, form configuration and
 * validation. Pure functions, shared by the page (build time) and the
 * browser (components/inquiry/inquiry.client.ts), and unit tested.
 *
 * The form is frontend only for now: nothing here talks to a network. When
 * the mail hand-off lands (form handling on a static site is an owed ADR,
 * docs/architecture/09-architecture-decisions.md), it plugs into the submit
 * handler in inquiry.client.ts and reuses `validateInquiry` as is.
 */

/** The one place the page URL is written; links to the form import this. */
export const PARTNER_INQUIRY_PATH = "/partner-inquiry/";

/** Query parameter that preselects the type tile, e.g. `?type=media`. */
export const INQUIRY_TYPE_PARAM = "type";

/**
 * PLACEHOLDER (open question): the real address of the partner team is not
 * decided. example.com is reserved for documentation, so this can never
 * reach a real inbox.
 */
export const PARTNER_TEAM_EMAIL = "partner-team@example.com";

/** The existing privacy policy page of the site. */
export const PRIVACY_POLICY_PATH = "/privacy-policy/";

export interface InquiryTopic {
  key: string;
  label: string;
}

/** Every topic chip any type can show. Texts are placeholders until final copy arrives. */
export const INQUIRY_TOPICS: readonly InquiryTopic[] = [
  { key: "recruiting", label: "Recruiting" },
  { key: "branding", label: "Branding" },
  { key: "networking", label: "Networking" },
  { key: "hackathon", label: "Hackathon" },
  { key: "coverage", label: "Coverage" },
  { key: "content", label: "Content" },
  { key: "community", label: "Community" },
  { key: "speaking", label: "Speaking" },
  { key: "visibility", label: "Visibility" },
];

export interface InquiryType {
  key: "company" | "media" | "initiative" | "speaker";
  label: string;
  description: string;
  /** Topic chips shown for this type, in display order (keys of INQUIRY_TOPICS). */
  topics: readonly string[];
}

/**
 * The type tiles, as in the design draft (Company, Media, Initiative,
 * Speaker), in that order. Configuration, not markup, so changing them is an
 * edit here. The texts and the topic chips of Company are the draft's; the
 * chips of the other three are placeholders until the partner team sends its
 * final copy.
 */
export const INQUIRY_TYPES: readonly InquiryType[] = [
  {
    key: "company",
    label: "Company",
    description: "Recruiting, branding, networking or our hackathon",
    topics: ["branding", "hackathon", "networking", "recruiting"],
  },
  {
    key: "media",
    label: "Media",
    description: "Coverage, content and media partnerships",
    topics: ["content", "coverage", "networking", "visibility"],
  },
  {
    key: "initiative",
    label: "Initiative",
    description: "Universities, student initiatives and communities",
    topics: ["community", "hackathon", "networking", "visibility"],
  },
  {
    key: "speaker",
    label: "Speaker",
    description: "Share your story on our stage",
    topics: ["community", "networking", "speaking", "visibility"],
  },
];

/** Topics shown while no type is chosen. */
export const DEFAULT_TOPICS: readonly string[] = [
  "branding",
  "hackathon",
  "networking",
  "recruiting",
];

export type InquiryTypeKey = InquiryType["key"];

/** Reads a `?type=` value; anything unknown or empty selects nothing. */
export function parseInquiryType(
  raw: string | null | undefined,
): InquiryTypeKey | null {
  const value = raw?.trim().toLowerCase();
  return INQUIRY_TYPES.find((type) => type.key === value)?.key ?? null;
}

/** Topic keys to show for a type (the default set when no type is chosen). */
export function topicsForType(
  type: string | null | undefined,
): readonly string[] {
  return (
    INQUIRY_TYPES.find((entry) => entry.key === type)?.topics ?? DEFAULT_TOPICS
  );
}

/**
 * The example texts in the fields type themselves once, as if a visitor were
 * filling the form in, field by field in page order. Rhythm of an ordinary
 * typist: about 190 ms between keys (roughly 60 words a minute), a little
 * uneven, with a small extra pause after a space or a comma. All numbers live
 * here so the speed is one edit.
 */
export const TYPING = {
  /** Mean time between two keys. */
  meanMs: 190,
  /** Keys vary by this share either way: 0.4 is 60 to 140 percent of the mean. */
  jitter: 0.4,
  /** Extra beat after a space, comma or full stop. */
  wordPauseMs: 70,
  /** Pause between finishing one field and starting the next. */
  fieldPauseMs: 450,
  /** Wait after the fields scroll into view before the first key. */
  startDelayMs: 500,
} as const;

/** Field names in the order the example text is typed (the page order). */
export const TYPING_ORDER = ["name", "email", "message"] as const;

/**
 * Milliseconds to wait after typing `char`. `random` is a number from 0 up to
 * 1 (Math.random in the browser), passed in so the result is testable.
 */
export function keystrokeDelay(char: string, random: number): number {
  const spread = 1 - TYPING.jitter + 2 * TYPING.jitter * random;
  const pause = /[\s,.]/.test(char) ? TYPING.wordPauseMs : 0;
  return Math.round(TYPING.meanMs * spread + pause);
}

export interface InquiryValues {
  type: string;
  topics: readonly string[];
  name: string;
  email: string;
  message: string;
  consent: boolean;
}

/** The fields that can fail validation, in page order. */
export const INQUIRY_REQUIRED_FIELDS = [
  "type",
  "name",
  "email",
  "consent",
] as const;

export type InquiryField = (typeof INQUIRY_REQUIRED_FIELDS)[number];

export type InquiryErrors = Partial<Record<InquiryField, string>>;

/** One at sign, a dot in the domain, no spaces: a typo check, not a mailbox check. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/**
 * Required: type, full name, a well formed work email, and the
 * privacy checkbox. Topics and the message are optional. Messages say
 * what to do, so they read well next to the field and to a screen reader.
 */
export function validateInquiry(values: InquiryValues): InquiryErrors {
  const errors: InquiryErrors = {};

  if (!INQUIRY_TYPES.some((type) => type.key === values.type)) {
    errors.type = "Choose how you are reaching out.";
  }
  if (!values.name.trim()) {
    errors.name = "Enter your full name.";
  }
  if (!values.email.trim()) {
    errors.email = "Enter your work email.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address, like jane@company.com.";
  }
  if (!values.consent) {
    errors.consent = "Agree to the privacy policy to send your inquiry.";
  }

  return errors;
}

/** Human label of a type key ("" for an unknown key). */
export function typeLabel(key: string): string {
  return INQUIRY_TYPES.find((type) => type.key === key)?.label ?? "";
}

/** Human label of a topic key (the key itself would be a leak of internals; "" if unknown). */
export function topicLabel(key: string): string {
  return INQUIRY_TOPICS.find((topic) => topic.key === key)?.label ?? "";
}

/**
 * The "View your inquiry" preview on the thank-you screen: what the visitor
 * filled in, as label and value rows, worded like the form. An empty optional
 * field says so instead of leaving a blank.
 */
export function inquirySummary(
  values: InquiryValues,
): { label: string; value: string }[] {
  const topics = values.topics.map(topicLabel).filter(Boolean).join(", ");
  return [
    { label: "You are reaching out as", value: typeLabel(values.type) },
    { label: "What matters most to you", value: topics || "None selected" },
    { label: "Full name", value: values.name },
    { label: "Work email", value: values.email },
    { label: "Anything we should know?", value: values.message || "Not given" },
  ];
}
