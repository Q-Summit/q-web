// Fail fast on missing secrets instead of falling back to an empty string: an
// empty PAYLOAD_SECRET silently disables token security, and an empty
// DATABASE_URI connects nowhere. Used by payload.config.ts and the Google SSO
// plugin factory (src/auth/google.ts).
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name} (see apps/cms/.env.example).`,
    );
  }
  return value;
}

/**
 * Whether this process is serving production, and therefore must have the
 * production hardening on.
 *
 * Two switches key off `NODE_ENV === "production"`: the `Secure` flag on the
 * admin session cookie and `disableLocalStrategy` (which turns off
 * email/password login). A runtime that somehow started without `NODE_ENV`
 * would lose BOTH at once, silently: the admin JWT would travel over plain
 * http and password login would come back. That is too much to hang on an
 * unset variable, so this cross-checks the platform's own signal.
 *
 * `VERCEL_ENV` is set by Vercel itself and cannot be forgotten the way a
 * hand-entered variable can, which is what makes it a useful second opinion.
 */
export function assertProductionHardening(): void {
  const isVercelProduction = process.env.VERCEL_ENV === "production";
  const isNodeProduction = process.env.NODE_ENV === "production";

  if (isVercelProduction && !isNodeProduction) {
    throw new Error(
      "Refusing to boot: VERCEL_ENV=production but NODE_ENV is " +
        `"${process.env.NODE_ENV ?? "(unset)"}". The admin session cookie would be issued ` +
        "without Secure and the email/password login strategy would be enabled " +
        "(src/collections/Users.ts). Set NODE_ENV=production.",
    );
  }

  // Cutover keys that must not silently default on Vercel production.
  // Missing Google SSO here is total lockout (local password strategy is
  // disabled); missing S3 leaves media on ephemeral Vercel disk.
  if (isVercelProduction) {
    requireEnv("CMS_SERVER_URL");
    requireEnv("SITE_URL");
    requireEnv("CONTENT_SYNC_TOKEN");
    requireEnv("CLOUDFLARE_DEPLOY_HOOK_URL");
    requireEnv("S3_BUCKET");
    requireEnv("S3_ENDPOINT");
    requireEnv("S3_ACCESS_KEY_ID");
    requireEnv("S3_SECRET_ACCESS_KEY");
    requireEnv("GOOGLE_CLIENT_ID");
    requireEnv("GOOGLE_CLIENT_SECRET");
    requireEnv("GOOGLE_WORKSPACE_DOMAIN");
    requireEnv("GOOGLE_SA_CLIENT_EMAIL");
    requireEnv("GOOGLE_SA_PRIVATE_KEY");
  }
}
