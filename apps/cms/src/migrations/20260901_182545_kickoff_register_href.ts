import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_kickoff" ADD COLUMN "kickoff_ui_register_href" varchar;
  ALTER TABLE "_page_kickoff_v" ADD COLUMN "version_kickoff_ui_register_href" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_kickoff" DROP COLUMN "kickoff_ui_register_href";
  ALTER TABLE "_page_kickoff_v" DROP COLUMN "version_kickoff_ui_register_href";`)
}
