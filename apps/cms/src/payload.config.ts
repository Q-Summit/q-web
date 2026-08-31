import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig, type Plugin } from "payload";
import sharp from "sharp";

import { googleOAuthPlugin } from "./auth/google";
import { Faqs } from "./collections/Faqs";
import { Jobs } from "./collections/Jobs";
import { Media } from "./collections/Media";
import { Partners } from "./collections/Partners";
import { PastTeams } from "./collections/PastTeams";
import { Speakers } from "./collections/Speakers";
import { Team } from "./collections/Team";
import { Testimonials } from "./collections/Testimonials";
import { Users } from "./collections/Users";
import { Legal } from "./globals/Legal";
import { PageContact } from "./globals/PageContact";
import { PageHackathon } from "./globals/PageHackathon";
import { PageHome } from "./globals/PageHome";
import { PageJobs } from "./globals/PageJobs";
import { PageKickoff } from "./globals/PageKickoff";
import { PageOurTeam } from "./globals/PageOurTeam";
import { PagePartner } from "./globals/PagePartner";
import { PagePastTeams } from "./globals/PagePastTeams";
import { PageProgram } from "./globals/PageProgram";
import { PageSpeaker } from "./globals/PageSpeaker";
import { PageTickets } from "./globals/PageTickets";
import { PageWhyq } from "./globals/PageWhyq";
import { SiteSettings } from "./globals/SiteSettings";
import { contentSyncEndpoint } from "./endpoints/content-sync";
import {
  LIVE_PREVIEW_GLOBALS,
  livePreviewUrlForGlobal,
} from "./lib/live-preview-url";
import { assertProductionHardening, requireEnv } from "./lib/require-env";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Public origin of the admin/API. Local: CMS_SERVER_URL or http://localhost:3000.
// Vercel production requires CMS_SERVER_URL via assertProductionHardening().
// cors/csrf are pinned to the known origins (the admin itself and, if set, the
// site) rather than left open.
const serverURL = process.env.CMS_SERVER_URL ?? "http://localhost:3000";
const trustedOrigins = [serverURL, process.env.SITE_URL].filter(
  (origin): origin is string => Boolean(origin),
);

// S3-compatible media storage (Cloudflare R2 in prod, MinIO in local dev via
// docker-compose). Enabled only when S3_BUCKET is set; otherwise the media
// collection falls back to local disk exactly as before (see
// docs/dev/local-development.md).
const plugins: Plugin[] = [];
if (process.env.S3_BUCKET) {
  plugins.push(
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET,
      config: {
        endpoint: requireEnv("S3_ENDPOINT"),
        region: process.env.S3_REGION || "auto",
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: {
          accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
          secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
        },
      },
    }),
  );
}

// Google Workspace SSO (see src/auth/google.ts): no-op unless GOOGLE_CLIENT_ID
// and GOOGLE_CLIENT_SECRET are both set, so local dev keeps password logins.
plugins.push(googleOAuthPlugin({ serverURL }));

assertProductionHardening();

export default buildConfig({
  serverURL,
  cors: trustedOrigins,
  csrf: trustedOrigins,
  // Draft-only package ingest for make propose (see endpoints/content-sync.ts).
  endpoints: [contentSyncEndpoint],
  // CMS is its own host (local :3000, prod cms.q-summit.de): mount the admin
  // at / so unauthenticated visitors land on /login, not /admin/login.
  // App router: app/(payload)/[[...segments]] (no admin/ folder).
  // https://payloadcms.com/docs/admin/overview#root-level-routes
  routes: {
    admin: "/",
  },
  // GraphQL is off. Nothing reads it: apps/web builds over the REST API and
  // content-sync uses the Local API, so this is pure attack surface. It also
  // removed a real inconsistency -- a GraphQL mutation carries `draft` as a
  // field argument rather than a query param, so the publish gate could not
  // tell a draft save from a live-row write there and had to fail closed,
  // which would have silently broken propose for any future GraphQL client.
  // The playground went with it. Turning this back on means giving
  // `isDraftWrite` a GraphQL-aware signal first (src/lib/publish-state.ts).
  graphQL: {
    disable: true,
  },
  admin: {
    user: Users.slug,
    meta: {
      title: "Q-Summit CMS",
      description: "Q-Summit content admin",
      icons: [
        { rel: "icon", type: "image/png", url: "/favicon.png" },
        { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
      ],
    },
    components: {
      graphics: {
        Logo: "/components/brand-logo#BrandLogo",
        Icon: "/components/brand-icon#BrandIcon",
      },
      // "Continue with Google" above the login form. Always registered so the
      // dev-generated import map covers production; the component renders
      // nothing while Google login is disabled (src/components/login-with-google.tsx).
      beforeLogin: ["/components/login-with-google#LoginWithGoogle"],
      // Heads/Admins first see how many proposals wait (renders nothing for
      // editors or an empty queue), then the role-aware Start-here primer.
      // Website pages lead the dashboard, matching their position at the top
      // of the nav: pages are what editors open, so the dashboard should hand
      // them the list rather than making them go find it. Then what needs
      // their attention (proposals waiting, Heads only), then the primer.
      // beforeDashboard renders above Payload's collection list, which is the
      // whole point; the `admin.dashboard` widget API would also work but is
      // marked @experimental in 3.86.
      beforeDashboard: [
        "/components/pages-widget#PagesWidget",
        "/components/review-queue-banner#ReviewQueueBanner",
        "/components/editor-guide#EditorGuide",
      ],
      // Custom nav so "Website pages" sorts above the collections. Payload
      // orders nav groups by first appearance in [...collections, ...globals],
      // which forces every global-derived group below every collection-derived
      // one, leaving the editors' main surface fourth, under Users. Array
      // order below cannot change that; this component is the only lever.
      // It renders DocsLink itself, which is why there is no beforeNavLinks
      // entry here: only DefaultNav reads that slot, so keeping it would
      // silently drop the Shortcuts block.
      Nav: "/components/nav#Nav",
      views: {
        docsHome: {
          Component: "/components/docs-home#DocsHome",
          path: "/docs",
        },
        reviewsHome: {
          Component: "/components/reviews-home#ReviewsHome",
          path: "/reviews",
        },
        auditHome: {
          Component: "/components/audit-home#AuditHome",
          path: "/audit",
        },
        // Which media file is used where, library-wide. Open to every editor
        // (unlike /reviews and /audit): editors are the ones uploading
        // duplicates, so they are the ones who need to find them.
        mediaUsageHome: {
          Component: "/components/media-usage-home#MediaUsageHome",
          path: "/media-usage",
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Live Preview: iframe the Astro site (SITE_URL) and postMessage draft
    // form state as editors type. Site client: apps/web live-preview/.
    livePreview: {
      // Open the preview pane on first visit to a page global. Editors came
      // here to see the page, so making them find the eye icon first was a
      // tax on the primary task. Payload remembers the toggle per user per
      // global afterwards, and `globals` below scopes this to page globals
      // only, so collections and Users are untouched.
      openByDefault: true,
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
      globals: [...LIVE_PREVIEW_GLOBALS],
      url: ({ globalConfig }) => livePreviewUrlForGlobal(globalConfig?.slug),
    },
  },
  // Clearer draft/publish labels so editors propose and Heads publish.
  i18n: {
    translations: {
      en: {
        version: {
          saveDraft: "Propose for review",
          publishChanges: "Publish to live site",
        },
      },
    },
  },
  // Nav order: Payload always renders collection-derived nav groups before
  // global-derived ones (@payloadcms/next groupNavItems), so array order here
  // is the only lever for group order. Lists & people first, System last.
  collections: [
    Partners,
    Jobs,
    Speakers,
    Team,
    PastTeams,
    Faqs,
    Testimonials,
    Media,
    Users,
  ],
  // Website pages group before Site-wide (SiteSettings after the Page*
  // globals); in-group order mirrors the live site top nav (the Site
  // Settings nav list). Legal stays last (System, fixed by Users above).
  globals: [
    PageHome,
    PageKickoff,
    PageWhyq,
    PageSpeaker,
    PagePartner,
    PageProgram,
    PageHackathon,
    PageOurTeam,
    PageJobs,
    PageTickets,
    PageContact,
    PagePastTeams,
    SiteSettings,
    Legal,
  ],
  // Drop the upload and relationship nodes from rich text. Both offer an
  // editor something the site cannot deliver: apps/web/src/lib/lexical-html.ts
  // has no case for either, so its default branch renders them as nothing --
  // an image inserted into a job description silently vanishes on the live
  // site. An upload node also buries a media id inside jsonb where the
  // reverse-reference lookup (lib/media-usage.ts) cannot see it, which would
  // let the delete guard call a file unused while rich text still points at
  // it. Images belong in the logo/photo upload fields, which are visible to
  // both. Blockquote and horizontal rule stay: those the site now renders.
  // Re-enabling upload means teaching lexical-html.ts an `upload` case and
  // extending the usage loader with a jsonb walk, in that order.
  editor: lexicalEditor({
    features: ({ defaultFeatures }) =>
      defaultFeatures.filter(
        (feature) => !["upload", "relationship"].includes(feature.key),
      ),
  }),
  // Cap uploaded files at 5 MiB. This is a top-level (global) busboy limit,
  // not a per-collection option -- Payload's per-collection upload config has
  // no size field. media is the only upload collection, so it is effectively
  // the media cap (see collections/Media.ts). abortOnLimit rejects an oversize
  // file with 413 instead of silently truncating it.
  upload: {
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
  },
  // Neon Postgres (Frankfurt) per ADR-0002. The connection string comes from
  // the environment only; it is never checked in (see .env.example).
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv("DATABASE_URI"),
    },
    // Migration files live in src/migrations (committed). Local dev relies on
    // schema push (below); production runs `payload migrate` at deploy time
    // instead of push (see docs/dev/go-live.md (CMS migrations) and docs/architecture/07-deployment.md).
    migrationDir: path.resolve(dirname, "migrations"),
    // Local / ops:cms-remote guard rail: ops:cms-remote sets this to "false" so
    // the admin UI never schema-pushes against the real database (see
    // scripts/ops/cms-remote.mjs). Defaults to push-enabled for normal local
    // dev against the docker-compose Postgres. Push is additionally skipped by
    // Payload whenever NODE_ENV=production or PAYLOAD_MIGRATING=true, so it
    // never runs against the deployed database.
    push: process.env.PAYLOAD_DB_PUSH !== "false",
  }),
  secret: requireEnv("PAYLOAD_SECRET"),
  plugins,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
