/**
 * Delegated DOM wiring for the event taxonomy (`events.ts`). Components mark
 * elements declaratively and never talk to posthog-js directly:
 *
 *   data-ph-event={EVENTS.x}         click (links, buttons)
 *   data-ph-toggle-event={EVENTS.x}  <details> opening (FAQ accordions)
 *   data-ph-page-event={EVENTS.x}    once per page load (Base `pageEvent`)
 *
 * plus `data-ph-prop-*` attributes on the same element for properties
 * (see `props.ts` for the name mapping). Document-level listeners mean new
 * marked elements need no extra wiring, and pages without marks pay nothing.
 */
import { propsFromAttrs } from "./props";

export type CaptureFn = (event: string, props: Record<string, string>) => void;

/** Raw [name, value] attribute pairs, so props.ts stays DOM-type-free. */
function attrsOf(el: Element): Array<[string, string]> {
  return Array.from(el.attributes, (a) => [a.name, a.value]);
}

export function wireAnalyticsDom(capture: CaptureFn): void {
  // Bubble-phase click delegation; closest() also catches clicks on children
  // of the marked element (e.g. a <span> inside a button).
  document.addEventListener("click", (e) => {
    const marked =
      e.target instanceof Element
        ? e.target.closest<HTMLElement>("[data-ph-event]")
        : null;
    const name = marked?.dataset.phEvent;
    if (marked && name) capture(name, propsFromAttrs(attrsOf(marked)));
  });

  // "toggle" does not bubble, so listen in the capture phase. Only the
  // opening transition counts (closing an accordion is not a signal).
  document.addEventListener(
    "toggle",
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !("open" in el)) return;
      const name = el.dataset.phToggleEvent;
      if (name && (el as HTMLDetailsElement).open)
        capture(name, propsFromAttrs(attrsOf(el)));
    },
    true,
  );

  // Page-level event: at most one marked element per page (the Base layout's
  // <main>); fires once per full page load, alongside the automatic $pageview.
  const page = document.querySelector<HTMLElement>("[data-ph-page-event]");
  const pageEvent = page?.dataset.phPageEvent;
  if (page && pageEvent) capture(pageEvent, propsFromAttrs(attrsOf(page)));
}
