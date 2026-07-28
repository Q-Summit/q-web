import React from "react";

// "Continue with Google" entry point above the admin login form, registered
// via admin.components.beforeLogin. Mandatory in production: with the local
// strategy disabled the stock login page renders no form at all (Payload
// issue #8979), so this link is the only way in. It is always registered (the
// import map is generated in dev, where Google login is off) and renders
// nothing when the Google OAuth client env is absent.
//
// Locally, disableLocalStrategy stays off (schema keeps password columns), so
// when Google env is set we also hide the stock email/password form to match
// the production Google-only surface. That hide lives in custom.css as
// `.qs-google-btn ~ .login__form`, which depends on beforeLogin rendering as a
// sibling before LoginForm -- and on the marker class existing only when the
// Google env is set, so a developer without it keeps a usable form.
export const LoginWithGoogle: React.FC = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    // In production the local strategy is off, so returning nothing here leaves
    // a blank page with no way to tell configuration from outage.
    if (process.env.NODE_ENV === "production") {
      return (
        <p className="qs-login-note">Sign-in is not configured. Contact IT.</p>
      );
    }
    return null;
  }
  return (
    <>
      {/* Plain <a>, never Payload's Link: that preventDefaults and pushes
          through the client router, which cannot follow an OAuth redirect. */}
      <a
        className="btn btn--style-primary btn--size-large btn--no-margin qs-google-btn"
        href="/api/users/oauth/google"
      >
        Continue with Google
      </a>
      <p className="qs-login-note">Use your q-summit.com account.</p>
    </>
  );
};
