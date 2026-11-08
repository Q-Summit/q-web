import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Ticket benefit rows store their tickets as five checkbox columns.
//
// Additive only: nothing is dropped or deleted. The 2027 select-hasMany
// tables from 20261107_215149_ticket_page_2027 stay in place as an archive.
// Their ticket values are copied into the new columns first, and their parent
// foreign keys are detached so that Payload rewriting array rows (or pruning
// versions) can never cascade-delete them. Payload no longer reads them.
//
// Idempotent: every step checks what exists. It replaces an earlier,
// never-merged migration (20261108_020509_ticket_rows_checkboxes) that dropped
// those tables; on a database where a preview build already ran that one, the
// columns exist and the tables are gone, so this migration changes nothing.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN IF NOT EXISTS "student" boolean DEFAULT false;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN IF NOT EXISTS "young_professional" boolean DEFAULT false;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN IF NOT EXISTS "start_up" boolean DEFAULT false;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN IF NOT EXISTS "investor" boolean DEFAULT false;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN IF NOT EXISTS "corporate" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN IF NOT EXISTS "student" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN IF NOT EXISTS "young_professional" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN IF NOT EXISTS "start_up" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN IF NOT EXISTS "investor" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN IF NOT EXISTS "corporate" boolean DEFAULT false;
  DO $$
  BEGIN
    IF to_regclass('public.page_tickets_included_groups_rows_tickets') IS NOT NULL THEN
      UPDATE "page_tickets_included_groups_rows" r SET
        "student" = r."student" OR EXISTS (SELECT 1 FROM "page_tickets_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'student'),
        "young_professional" = r."young_professional" OR EXISTS (SELECT 1 FROM "page_tickets_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'young-professional'),
        "start_up" = r."start_up" OR EXISTS (SELECT 1 FROM "page_tickets_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'start-up'),
        "investor" = r."investor" OR EXISTS (SELECT 1 FROM "page_tickets_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'investor'),
        "corporate" = r."corporate" OR EXISTS (SELECT 1 FROM "page_tickets_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'corporate');
      ALTER TABLE "page_tickets_included_groups_rows_tickets" DROP CONSTRAINT IF EXISTS "page_tickets_included_groups_rows_tickets_parent_fk";
    END IF;
    IF to_regclass('public._page_tickets_v_version_included_groups_rows_tickets') IS NOT NULL THEN
      UPDATE "_page_tickets_v_version_included_groups_rows" r SET
        "student" = r."student" OR EXISTS (SELECT 1 FROM "_page_tickets_v_version_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'student'),
        "young_professional" = r."young_professional" OR EXISTS (SELECT 1 FROM "_page_tickets_v_version_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'young-professional'),
        "start_up" = r."start_up" OR EXISTS (SELECT 1 FROM "_page_tickets_v_version_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'start-up'),
        "investor" = r."investor" OR EXISTS (SELECT 1 FROM "_page_tickets_v_version_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'investor'),
        "corporate" = r."corporate" OR EXISTS (SELECT 1 FROM "_page_tickets_v_version_included_groups_rows_tickets" t WHERE t."parent_id" = r."id" AND t."value" = 'corporate');
      ALTER TABLE "_page_tickets_v_version_included_groups_rows_tickets" DROP CONSTRAINT IF EXISTS "_page_tickets_v_version_included_groups_rows_tickets_parent_fk";
    END IF;
  END $$;`)
}

// Removes only the checkbox columns this migration added. The archived
// tables are left as they are (their foreign keys stay detached, since rows
// may now point at array rows that no longer exist).
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN IF EXISTS "student";
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN IF EXISTS "young_professional";
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN IF EXISTS "start_up";
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN IF EXISTS "investor";
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN IF EXISTS "corporate";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN IF EXISTS "student";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN IF EXISTS "young_professional";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN IF EXISTS "start_up";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN IF EXISTS "investor";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN IF EXISTS "corporate";`)
}
