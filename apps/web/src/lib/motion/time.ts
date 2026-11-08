import { cssTimeMs } from "./css-time";

/** A duration custom property on `el` (default: the root), in ms. */
export function tokenMs(
  name: string,
  fallback: number,
  el: Element = document.documentElement,
): number {
  return cssTimeMs(getComputedStyle(el).getPropertyValue(name), fallback);
}
