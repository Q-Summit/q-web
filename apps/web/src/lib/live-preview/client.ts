/**
 * Payload Live Preview client for the static Astro site.
 * Uses vanilla @payloadcms/live-preview (no React). Activates only inside
 * the CMS admin iframe (or when ?live-preview=1 is present for debugging).
 *
 * Updates DOM nodes marked with data-lp="dot.path.to.field" from the merged
 * global document. Depth is 0 so we do not depend on cross-origin cookies
 * for relationship populate (text/textarea/link fields still live-update).
 */
import { ready, subscribe, unsubscribe } from "@payloadcms/live-preview";

function getPath(data: unknown, path: string): unknown {
  if (!path) return data;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, data);
}

/** Payload string-array rows are { text: string }[]; flatten for display. */
function displayValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) {
    const parts = value
      .map((row) => {
        if (typeof row === "string") return row;
        if (row && typeof row === "object" && "text" in row) {
          return String((row as { text: unknown }).text ?? "");
        }
        return "";
      })
      .filter(Boolean);
    return parts.length ? parts.join("\n") : "";
  }
  if (typeof value === "object" && value !== null && "label" in value) {
    return String((value as { label: unknown }).label ?? "");
  }
  return null;
}

function applyDocument(data: unknown): void {
  document.querySelectorAll<HTMLElement>("[data-lp]").forEach((el) => {
    const path = el.getAttribute("data-lp");
    if (!path) return;
    const value = getPath(data, path);

    if (el instanceof HTMLAnchorElement) {
      const hrefPath = el.getAttribute("data-lp-href");
      if (hrefPath) {
        const href = getPath(data, hrefPath);
        if (typeof href === "string") el.setAttribute("href", href);
      }
      const label = displayValue(value);
      if (label != null) el.textContent = label;
      return;
    }

    if (el.hasAttribute("data-lp-html") && value && typeof value === "object") {
      // Lexical rich text: leave as-is unless we have plain string HTML later.
      return;
    }

    // Multi-line announcement: each child span gets array[i].text
    if (el.hasAttribute("data-lp-lines") && Array.isArray(value)) {
      const spans = el.querySelectorAll(":scope > span");
      value.forEach((row, i) => {
        const span = spans[i];
        if (!span) return;
        const text =
          row && typeof row === "object" && "text" in row
            ? String((row as { text: unknown }).text ?? "")
            : typeof row === "string"
              ? row
              : "";
        span.textContent = text;
      });
      return;
    }

    const text = displayValue(value);
    if (text != null) el.textContent = text;
  });

  // Optional list items: [data-lp-list="whyAttend.cards"] with
  // [data-lp-list-title] / [data-lp-list-description] inside each child.
  document.querySelectorAll<HTMLElement>("[data-lp-list]").forEach((list) => {
    const path = list.getAttribute("data-lp-list");
    if (!path) return;
    const rows = getPath(data, path);
    if (!Array.isArray(rows)) return;
    const items = list.querySelectorAll<HTMLElement>(
      ":scope > [data-lp-list-item]",
    );
    rows.forEach((row, i) => {
      const item = items[i];
      if (!item || !row || typeof row !== "object") return;
      const rec = row as Record<string, unknown>;
      const titleEl = item.querySelector("[data-lp-list-title]");
      const descEl = item.querySelector("[data-lp-list-description]");
      const valueEl = item.querySelector("[data-lp-list-value]");
      const labelEl = item.querySelector("[data-lp-list-label]");
      if (titleEl && rec.title != null) titleEl.textContent = String(rec.title);
      if (descEl && rec.description != null)
        descEl.textContent = String(rec.description);
      if (valueEl && rec.value != null) valueEl.textContent = String(rec.value);
      if (labelEl && rec.label != null) labelEl.textContent = String(rec.label);
    });
  });
}

function shouldBoot(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has("live-preview")) return true;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin parent access throws; being framed by CMS counts as yes.
    return true;
  }
}

export function bootLivePreview(options: {
  serverURL: string;
  initialData?: Record<string, unknown>;
}): void {
  if (!shouldBoot()) return;
  const serverURL = options.serverURL.replace(/\/$/, "");
  if (!serverURL) return;

  // Payload's default mergeData POSTs to /api/globals/:slug with credentials
  // to populate relationships. That fails cross-origin from the Astro iframe
  // (no session cookie / CORS friction) and silently breaks live typing.
  // At depth 0 we only need the form draft Payload already posts -- skip the
  // round-trip and apply incoming data directly.
  const subscription = subscribe({
    serverURL,
    depth: 0,
    initialData: options.initialData ?? {},
    requestHandler: async ({ data }) =>
      ({
        json: async () =>
          ((data as { data?: Record<string, unknown> }).data ?? {}) as Record<
            string,
            unknown
          >,
      }) as Response,
    callback: (merged) => {
      applyDocument(merged);
    },
  });

  ready({ serverURL });

  window.addEventListener(
    "pagehide",
    () => {
      // Payload's own types disagree across this boundary: subscribe() returns
      // `(event: MessageEvent) => Promise<void> | void`, while unsubscribe()
      // accepts only `(event: MessageEvent) => void`. Runtime is fine because
      // unsubscribe just removes the listener by identity, so narrow the
      // handler back rather than widen unsubscribe.
      unsubscribe(subscription as (event: MessageEvent) => void);
    },
    { once: true },
  );
}
