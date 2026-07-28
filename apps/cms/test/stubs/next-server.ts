/** Vitest stub: real `after` needs a Next request; tests use the timer path. */
export function after(_fn: () => void | Promise<void>): void {
  throw new Error("next/server after is unavailable in vitest");
}
