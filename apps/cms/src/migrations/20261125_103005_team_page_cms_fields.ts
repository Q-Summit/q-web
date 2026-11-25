import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_our_team" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "page_our_team" ADD COLUMN "tab_label" varchar;
  ALTER TABLE "page_our_team" ADD COLUMN "division_heading" varchar;
  ALTER TABLE "_page_our_team_v" ADD COLUMN "version_hero_image_id" integer;
  ALTER TABLE "_page_our_team_v" ADD COLUMN "version_tab_label" varchar;
  ALTER TABLE "_page_our_team_v" ADD COLUMN "version_division_heading" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "tab_label" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "year_heading" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "photo_alt" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_tab_label" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_year_heading" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_photo_alt" varchar;
  ALTER TABLE "page_our_team" ADD CONSTRAINT "page_our_team_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_our_team_v" ADD CONSTRAINT "_page_our_team_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "page_our_team_hero_image_idx" ON "page_our_team" USING btree ("hero_image_id");
  CREATE INDEX "_page_our_team_v_version_version_hero_image_idx" ON "_page_our_team_v" USING btree ("version_hero_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_our_team" DROP CONSTRAINT "page_our_team_hero_image_id_media_id_fk";
  
  ALTER TABLE "_page_our_team_v" DROP CONSTRAINT "_page_our_team_v_version_hero_image_id_media_id_fk";
  
  DROP INDEX "page_our_team_hero_image_idx";
  DROP INDEX "_page_our_team_v_version_version_hero_image_idx";
  ALTER TABLE "page_our_team" DROP COLUMN "hero_image_id";
  ALTER TABLE "page_our_team" DROP COLUMN "tab_label";
  ALTER TABLE "page_our_team" DROP COLUMN "division_heading";
  ALTER TABLE "_page_our_team_v" DROP COLUMN "version_hero_image_id";
  ALTER TABLE "_page_our_team_v" DROP COLUMN "version_tab_label";
  ALTER TABLE "_page_our_team_v" DROP COLUMN "version_division_heading";
  ALTER TABLE "page_past_teams" DROP COLUMN "tab_label";
  ALTER TABLE "page_past_teams" DROP COLUMN "year_heading";
  ALTER TABLE "page_past_teams" DROP COLUMN "photo_alt";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_tab_label";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_year_heading";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_photo_alt";`)
}
