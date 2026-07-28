"use client";

// Type-only: this component returns a plain string, so it never renders JSX.
import type React from "react";
import { useRowLabel } from "@payloadcms/ui";

/**
 * Row label for the array fields in the page globals.
 *
 * Without it every row collapses to "Item 01", so a page with six arrays
 * (Tickets) or four (Home) is a wall of numbered rows an editor has to open
 * one by one to find anything. Falls through the usual title-ish keys and
 * keeps the number as a last resort.
 */
export const TitleRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>();
  const fallback = `Item ${String((rowNumber ?? 0) + 1).padStart(2, "0")}`;

  for (const key of ["title", "label", "heading", "value", "text", "date"]) {
    const candidate = data?.[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }

  return fallback;
};
