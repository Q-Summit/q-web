import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_past_teams" ADD COLUMN "story_hero_eyebrow" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_hero_heading" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_hero_lead" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_cue_label" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_origin_eyebrow" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_origin_heading" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_origin_sub" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_origin_text" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_teams_eyebrow" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_teams_heading" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_teams_text" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_album_eyebrow" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_album_heading" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_album_hint" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_album_hint_touch" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_back_label" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_closing_eyebrow" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_closing_heading" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_closing_text" varchar;
  ALTER TABLE "page_past_teams" ADD COLUMN "story_closing_button_label" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_hero_eyebrow" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_hero_heading" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_hero_lead" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_cue_label" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_origin_eyebrow" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_origin_heading" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_origin_sub" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_origin_text" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_teams_eyebrow" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_teams_heading" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_teams_text" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_album_eyebrow" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_album_heading" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_album_hint" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_album_hint_touch" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_back_label" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_closing_eyebrow" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_closing_heading" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_closing_text" varchar;
  ALTER TABLE "_page_past_teams_v" ADD COLUMN "version_story_closing_button_label" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_past_teams" DROP COLUMN "story_hero_eyebrow";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_hero_heading";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_hero_lead";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_cue_label";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_origin_eyebrow";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_origin_heading";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_origin_sub";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_origin_text";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_teams_eyebrow";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_teams_heading";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_teams_text";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_album_eyebrow";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_album_heading";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_album_hint";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_album_hint_touch";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_back_label";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_closing_eyebrow";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_closing_heading";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_closing_text";
  ALTER TABLE "page_past_teams" DROP COLUMN "story_closing_button_label";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_hero_eyebrow";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_hero_heading";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_hero_lead";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_cue_label";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_origin_eyebrow";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_origin_heading";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_origin_sub";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_origin_text";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_teams_eyebrow";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_teams_heading";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_teams_text";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_album_eyebrow";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_album_heading";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_album_hint";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_album_hint_touch";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_back_label";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_closing_eyebrow";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_closing_heading";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_closing_text";
  ALTER TABLE "_page_past_teams_v" DROP COLUMN "version_story_closing_button_label";`)
}
