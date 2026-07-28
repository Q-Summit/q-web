import React from "react";

/**
 * Full Q mark for the Payload login view (`admin.components.graphics.Logo`).
 * Served from apps/cms/public so the CMS does not depend on the site Worker.
 */
export const BrandLogo: React.FC = () => (
  <img
    className="qs-brand-logo"
    src="/q-logo.webp"
    alt="Q-Summit"
    width={160}
    height={160}
    decoding="async"
  />
);
