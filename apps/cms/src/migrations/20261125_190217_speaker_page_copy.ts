import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_speaker" ADD COLUMN "hot_topics_label" varchar;
  ALTER TABLE "page_speaker" ADD COLUMN "hot_topics_heading" varchar;
  ALTER TABLE "page_speaker" ADD COLUMN "hot_topics_intro" varchar;
  ALTER TABLE "page_speaker" ADD COLUMN "lineup_pill" varchar;
  ALTER TABLE "_page_speaker_v" ADD COLUMN "version_hot_topics_label" varchar;
  ALTER TABLE "_page_speaker_v" ADD COLUMN "version_hot_topics_heading" varchar;
  ALTER TABLE "_page_speaker_v" ADD COLUMN "version_hot_topics_intro" varchar;
  ALTER TABLE "_page_speaker_v" ADD COLUMN "version_lineup_pill" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_speaker" DROP COLUMN "hot_topics_label";
  ALTER TABLE "page_speaker" DROP COLUMN "hot_topics_heading";
  ALTER TABLE "page_speaker" DROP COLUMN "hot_topics_intro";
  ALTER TABLE "page_speaker" DROP COLUMN "lineup_pill";
  ALTER TABLE "_page_speaker_v" DROP COLUMN "version_hot_topics_label";
  ALTER TABLE "_page_speaker_v" DROP COLUMN "version_hot_topics_heading";
  ALTER TABLE "_page_speaker_v" DROP COLUMN "version_hot_topics_intro";
  ALTER TABLE "_page_speaker_v" DROP COLUMN "version_lineup_pill";`)
}
