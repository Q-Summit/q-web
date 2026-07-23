// Next.js config wrapped by Payload. withPayload wires the admin panel,
// server functions, and the REST/GraphQL routes into the app router.
import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Old /admin URLs (bookmarks, docs) → root-mounted admin (routes.admin: "/").
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/",
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },

  // Security headers for the CMS host. The site gets these from
  // apps/web/public/_headers; Vercel ships none by default, so the admin
  // panel -- the surface that holds the publish credential -- had strictly
  // weaker headers than the public marketing site.
  //
  // HSTS IS set here, unlike on the site: Cloudflare owns the apex domain's
  // HSTS via the dashboard (see apps/web/public/_headers), but cms.q-summit.de
  // is a Vercel host with no such control, and the admin session cookie is
  // now Secure-only, so the redirect must not be downgradeable.
  //
  // frame-ancestors 'none': nothing legitimately iframes the admin panel.
  // Live Preview runs the other way round, with the admin iframing the site.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
