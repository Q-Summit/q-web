import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "speakers" ADD COLUMN "stage_photo_id" integer;
  ALTER TABLE "_speakers_v" ADD COLUMN "version_stage_photo_id" integer;
  ALTER TABLE "speakers" ADD CONSTRAINT "speakers_stage_photo_id_media_id_fk" FOREIGN KEY ("stage_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_speakers_v" ADD CONSTRAINT "_speakers_v_version_stage_photo_id_media_id_fk" FOREIGN KEY ("version_stage_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "speakers_stage_photo_idx" ON "speakers" USING btree ("stage_photo_id");
  CREATE INDEX "_speakers_v_version_version_stage_photo_idx" ON "_speakers_v" USING btree ("version_stage_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "speakers" DROP CONSTRAINT "speakers_stage_photo_id_media_id_fk";
  
  ALTER TABLE "_speakers_v" DROP CONSTRAINT "_speakers_v_version_stage_photo_id_media_id_fk";
  
  DROP INDEX "speakers_stage_photo_idx";
  DROP INDEX "_speakers_v_version_version_stage_photo_idx";
  ALTER TABLE "speakers" DROP COLUMN "stage_photo_id";
  ALTER TABLE "_speakers_v" DROP COLUMN "version_stage_photo_id";`)
}
