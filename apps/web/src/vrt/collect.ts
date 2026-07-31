/*
 * VRT gallery collector.
 *
 * Globs every co-located `*.vrt.ts` next to a component and flattens it into a
 * flat list of entries (one per component x variant). The gallery route
 * (src/pages/vrt/[slug].astro) reads from here to emit one page per variant.
 *
 * Co-location (not one central registry) is deliberate: each component owns its
 * variants in its own file, so adding or editing coverage never touches a
 * shared file and parallel edits do not conflict. See docs/dev/visual-testing.md.
 */

/** The shape every `*.vrt.ts` default-exports. */
export interface VrtDef {
  /** The imported `.astro` component to render. */
  component: unknown;
  /** Named variants: each key is a variant id, each value the component props. */
  variants: Record<string, Record<string, unknown>>;
}

export interface VrtEntry {
  /** Stable id, e.g. `home-stats-band--long-labels`. Drives the URL + filename. */
  id: string;
  /** Component slug, e.g. `home-stats-band`. Groups variants in the report. */
  group: string;
  /** Variant name, e.g. `long-labels`. */
  variant: string;
  Component: unknown;
  props: Record<string, unknown>;
}

// Eager glob so the entries are available synchronously at build time (inside
// getStaticPaths and the endpoint). Vite resolves the `.astro` imports the
// `.vrt.ts` files make.
const modules = import.meta.glob<{ default: VrtDef }>(
  "../components/**/*.vrt.ts",
  {
    eager: true,
  },
);

/** `../components/home/StatsBand.vrt.ts` -> `home-stats-band`. */
function slugFromPath(path: string): string {
  return path
    .replace(/^.*\/components\//, "")
    .replace(/\.vrt\.ts$/, "")
    .replace(/\//g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

// A variant id becomes a URL slug and a screenshot filename, so it must be a
// plain kebab token. Rejecting anything else here fails the build loudly rather
// than letting a stray `/`, `..`, or markdown/shell metacharacter flow into the
// gallery route, the baseline path, or the PR comment. `group` is path-derived
// and already safe, but is checked too for symmetry.
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const entries: VrtEntry[] = Object.entries(modules)
  .flatMap(([path, mod]) => {
    const def = mod.default;
    const group = slugFromPath(path);
    if (!SAFE_ID.test(group)) {
      throw new Error(
        `VRT component slug "${group}" (from ${path}) is not kebab-case [a-z0-9-].`,
      );
    }
    return Object.entries(def.variants).map(([variant, props]) => {
      if (!SAFE_ID.test(variant)) {
        throw new Error(
          `VRT variant id "${variant}" in ${path} must be kebab-case [a-z0-9-]; ` +
            `it becomes a URL slug and screenshot filename.`,
        );
      }
      return {
        id: `${group}--${variant}`,
        group,
        variant,
        Component: def.component,
        props,
      };
    });
  })
  .sort((a, b) => a.id.localeCompare(b.id));
