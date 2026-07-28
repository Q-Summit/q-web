import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Neon was migrated from an earlier revision of the initial schema that
 * lacked Team.linkedin. The initial migration file later gained the column,
 * so payload_migrations already shows 20260726_182256_initial as applied
 * while the live table never received linkedin / version_linkedin. Payload
 * SELECT then 500s every /api/team request and blocks CMS-mode site builds.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "linkedin" varchar;
    ALTER TABLE "_team_v" ADD COLUMN IF NOT EXISTS "version_linkedin" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "team" DROP COLUMN IF EXISTS "linkedin";
    ALTER TABLE "_team_v" DROP COLUMN IF EXISTS "version_linkedin";
  `)
}
