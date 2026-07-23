/**
 * Nav group order, top to bottom, used by the custom Nav
 * (src/components/nav.tsx).
 *
 * Payload derives nav groups from `[...collections, ...globals]` and orders
 * them by first appearance, which forces every global-derived group below
 * every collection-derived one. That left "Website pages" -- where editors
 * actually spend their time -- fourth, under Users. This list is the override.
 *
 * A group not listed here sorts after all of these, keeping its own relative
 * position, so a new group appears at the bottom rather than silently landing
 * in the middle. test/nav-groups.test.ts fails if a config introduces one.
 *
 * Lives in its own module, free of React and Payload imports, so the test can
 * read it without pulling the admin bundle (and its CSS) into Node.
 */
export const NAV_GROUP_ORDER = [
  "Website pages",
  "Site-wide",
  "Lists & people",
  "Shared assets",
  "System",
] as const;

/** Sort index for a group label; unknown groups sort last. */
export function navGroupRank(label: unknown): number {
  const index = (NAV_GROUP_ORDER as readonly string[]).indexOf(String(label));
  return index === -1 ? NAV_GROUP_ORDER.length : index;
}
