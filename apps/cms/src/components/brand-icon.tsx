import React from "react";

/**
 * Compact Q mark for the admin nav (`admin.components.graphics.Icon`).
 * Same asset as the login logo; CSS sizes it for the sidebar slot.
 */
export const BrandIcon: React.FC = () => (
  <img
    className="qs-brand-icon"
    src="/q-logo.webp"
    alt="Q-Summit"
    width={28}
    height={28}
    decoding="async"
  />
);
