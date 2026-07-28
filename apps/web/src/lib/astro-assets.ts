/** Re-export `astro:assets` so .astro frontmatter can import via a .ts module
 * that participates in the apps/web tsconfig (editor isolation often misses
 * ambient `astro/client` types on .astro scripts). */
export { Font, Picture, getImage } from "astro:assets";
