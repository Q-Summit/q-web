/*
 * Which posts the home page's social section shows, and in which order
 * (components/home/SocialSection.astro, DESIGN.md HOME-1).
 *
 * The rule, so nobody has to rearrange anything when a post is published:
 * the list in the content grows at its end. Every new post is added as the
 * last row; the page shows the newest few, the newest at the far left, each
 * older one a place further right, and a post that no longer fits simply
 * is not shown any more (it may stay in the list).
 *
 * Pure (no node:fs, no astro imports), so it is unit tested.
 */

/** How many posts the section shows. */
export const HOME_POST_FRAMES = 4;

/**
 * The posts to show, left to right: the last `count` rows of the list in
 * reverse order, so the row added last comes first.
 */
export function latestPosts<T>(
  posts: readonly T[],
  count: number = HOME_POST_FRAMES,
): T[] {
  if (count <= 0) return [];
  return posts.slice(-count).reverse();
}
