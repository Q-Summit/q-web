/**
 * Pure helper shared by `dom.ts` and the unit tests: turns an element's
 * `data-ph-prop-*` attributes into an event-properties object. It reads the
 * raw attribute names (not `el.dataset`, whose camelCasing cannot be
 * losslessly reversed for keys containing digits), so a taxonomy prop key
 * round-trips exactly: `data-ph-prop-tier-name` -> `tier_name`.
 *
 * Kept free of DOM lib types by taking `[name, value]` attribute pairs, so
 * the node vitest project can typecheck it without `lib: ["dom"]`.
 */
const PREFIX = "data-ph-prop-";

export function propsFromAttrs(
  attrs: Iterable<[string, string]>,
): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [name, value] of attrs) {
    if (!name.startsWith(PREFIX)) continue;
    const key = name.slice(PREFIX.length).replace(/-/g, "_");
    if (key) props[key] = value;
  }
  return props;
}
