/**
 * Breakpoint widths for VRT screenshots. Single source of truth for
 * gallery.spec.ts (what Playwright shoots) and vrt-report.mjs (what orphan
 * prune expects on disk). Keep the workflow `safe_rel` bash regex in
 * .github/workflows/visual.yml in lockstep when changing these.
 */
export const WIDTHS = [390, 768, 1280] as const;
