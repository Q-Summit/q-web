import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds Team.email (and its drafts column) for the mail icon on the member
 * cards, mirroring 20260728_190500_team_linkedin. IF NOT EXISTS keeps the
 * migration safe on databases where schema push already created the column.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "email" varchar;
    ALTER TABLE "_team_v" ADD COLUMN IF NOT EXISTS "version_email" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "team" DROP COLUMN IF EXISTS "email";
    ALTER TABLE "_team_v" DROP COLUMN IF EXISTS "version_email";
  `)
}
