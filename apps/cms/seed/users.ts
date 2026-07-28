import { getPayload } from "payload";

import { normalizeContentSyncUserEmail } from "../src/content-sync/auth";
import config from "../src/payload.config";

// Idempotent local-dev seed: throwaway credentials only, never real secrets.
// Role matrix for content-sync practice:
//   admin     manage users / break-glass
//   approver  Publish (go-live); agents never use this account
//   editor    drafts only (partner-team + sync identity from env)
const BASE_USERS = [
  {
    email: "admin@example.com",
    password: "localdev-admin1",
    divisions: ["it"],
    roles: ["admin"],
  },
  {
    email: "approver@example.com",
    password: "localdev-approver1",
    divisions: ["pr", "partner", "concept", "chair"],
    roles: ["approver"],
  },
  {
    email: "partner-team@example.com",
    password: "localdev-partner1",
    divisions: ["partner"],
    roles: ["editor"],
  },
] as const;

const run = async () => {
  // Content-sync identity comes from CONTENT_SYNC_USER_EMAIL (must be customized
  // off the example "dev"; normalizeContentSyncUserEmail enforces that).
  let syncEmail: string;
  try {
    syncEmail = normalizeContentSyncUserEmail(
      process.env.CONTENT_SYNC_USER_EMAIL,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error(
      "  Fix apps/cms/.env, then re-run: pnpm --filter cms exec payload run seed/users.ts",
    );
    process.exit(1);
  }

  const users = [
    ...BASE_USERS,
    {
      email: syncEmail,
      password: "localdev-sync1",
      divisions: ["pr", "partner", "concept", "chair"] as const,
      roles: ["editor"] as const,
    },
  ];

  const payload = await getPayload({ config });

  for (const user of users) {
    const existing = await payload.find({
      collection: "users",
      where: { email: { equals: user.email } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      // Local stand-in for YOUR Google user, so `make propose` has someone to
      // resolve against offline. Not a bot: in production this row is created by
      // your own Google sign-in and its roles come from Workspace groups.
      await payload.update({
        collection: "users",
        id: existing.docs[0]!.id,
        data: {
          divisions: [...user.divisions],
          roles: [...user.roles],
        },
        overrideAccess: true,
      });
      payload.logger.info(`Updated user ${user.email}`);
      continue;
    }

    await payload.create({
      collection: "users",
      data: {
        email: user.email,
        password: user.password,
        divisions: [...user.divisions],
        roles: [...user.roles],
      },
    });
    payload.logger.info(`Created user ${user.email}`);
  }

  process.exit(0);
};

await run().catch((error) => {
  console.error(error);
  process.exit(1);
});
