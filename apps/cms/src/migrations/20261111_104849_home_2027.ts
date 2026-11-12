import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_home_social_posts_platform" AS ENUM('linkedin', 'instagram');
  CREATE TYPE "public"."enum__page_home_v_version_social_posts_platform" AS ENUM('linkedin', 'instagram');
  CREATE TABLE "page_home_hero_lead_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_home_previous_speakers_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_home_previous_speakers_stand_ins" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_home_social_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_page_home_social_posts_platform",
  	"href" varchar,
  	"image_id" integer,
  	"image_alt" varchar
  );
  
  CREATE TABLE "_page_home_v_version_hero_lead_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v_version_previous_speakers_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v_version_previous_speakers_stand_ins" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v_version_social_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum__page_home_v_version_social_posts_platform",
  	"href" varchar,
  	"image_id" integer,
  	"image_alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "site_settings_nav_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_nav_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "page_home_partner_band_items" ADD COLUMN "description" varchar;
  ALTER TABLE "page_home_why_attend_cards" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "page_home_why_attend_cards" ADD COLUMN "href" varchar;
  ALTER TABLE "page_home_why_attend_cards" ADD COLUMN "link_label" varchar;
  ALTER TABLE "page_home_why_attend_cards" ADD COLUMN "image_id" integer;
  ALTER TABLE "page_home_why_attend_cards" ADD COLUMN "image_alt" varchar;
  ALTER TABLE "page_home" ADD COLUMN "hero_badge" varchar;
  ALTER TABLE "page_home" ADD COLUMN "countdown_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "countdown_days_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "countdown_hours_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "countdown_minutes_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "countdown_seconds_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "countdown_spoken_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "countdown_live_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "partner_band_eyebrow" varchar;
  ALTER TABLE "page_home" ADD COLUMN "partner_band_heading" varchar;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_eyebrow" varchar;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_alumni_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_lineup_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_lineup_year" numeric;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_lineup_slots" numeric DEFAULT 4;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_lineup_show_placeholders" boolean DEFAULT false;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_lineup_placeholder_name" varchar;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_lineup_placeholder_role" varchar;
  ALTER TABLE "page_home" ADD COLUMN "previous_speakers_stand_in_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "why_attend_eyebrow" varchar;
  ALTER TABLE "page_home" ADD COLUMN "social_eyebrow" varchar;
  ALTER TABLE "page_home" ADD COLUMN "social_heading" varchar;
  ALTER TABLE "page_home" ADD COLUMN "social_intro" varchar;
  ALTER TABLE "page_home" ADD COLUMN "social_linkedin_label" varchar;
  ALTER TABLE "page_home" ADD COLUMN "social_instagram_label" varchar;
  ALTER TABLE "_page_home_v_version_partner_band_items" ADD COLUMN "description" varchar;
  ALTER TABLE "_page_home_v_version_why_attend_cards" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_page_home_v_version_why_attend_cards" ADD COLUMN "href" varchar;
  ALTER TABLE "_page_home_v_version_why_attend_cards" ADD COLUMN "link_label" varchar;
  ALTER TABLE "_page_home_v_version_why_attend_cards" ADD COLUMN "image_id" integer;
  ALTER TABLE "_page_home_v_version_why_attend_cards" ADD COLUMN "image_alt" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_hero_badge" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_countdown_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_countdown_days_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_countdown_hours_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_countdown_minutes_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_countdown_seconds_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_countdown_spoken_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_countdown_live_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_partner_band_eyebrow" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_partner_band_heading" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_eyebrow" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_alumni_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_lineup_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_lineup_year" numeric;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_lineup_slots" numeric DEFAULT 4;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_lineup_show_placeholders" boolean DEFAULT false;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_lineup_placeholder_name" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_lineup_placeholder_role" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_previous_speakers_stand_in_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_why_attend_eyebrow" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_social_eyebrow" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_social_heading" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_social_intro" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_social_linkedin_label" varchar;
  ALTER TABLE "_page_home_v" ADD COLUMN "version_social_instagram_label" varchar;
  ALTER TABLE "page_home_hero_lead_lines" ADD CONSTRAINT "page_home_hero_lead_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_previous_speakers_highlights" ADD CONSTRAINT "page_home_previous_speakers_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_previous_speakers_stand_ins" ADD CONSTRAINT "page_home_previous_speakers_stand_ins_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_social_posts" ADD CONSTRAINT "page_home_social_posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_home_social_posts" ADD CONSTRAINT "page_home_social_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_hero_lead_lines" ADD CONSTRAINT "_page_home_v_version_hero_lead_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_previous_speakers_highlights" ADD CONSTRAINT "_page_home_v_version_previous_speakers_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_previous_speakers_stand_ins" ADD CONSTRAINT "_page_home_v_version_previous_speakers_stand_ins_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_social_posts" ADD CONSTRAINT "_page_home_v_version_social_posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_social_posts" ADD CONSTRAINT "_page_home_v_version_social_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_nav_children" ADD CONSTRAINT "site_settings_nav_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_nav_children" ADD CONSTRAINT "_site_settings_v_version_nav_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_nav"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_home_hero_lead_lines_order_idx" ON "page_home_hero_lead_lines" USING btree ("_order");
  CREATE INDEX "page_home_hero_lead_lines_parent_id_idx" ON "page_home_hero_lead_lines" USING btree ("_parent_id");
  CREATE INDEX "page_home_previous_speakers_highlights_order_idx" ON "page_home_previous_speakers_highlights" USING btree ("_order");
  CREATE INDEX "page_home_previous_speakers_highlights_parent_id_idx" ON "page_home_previous_speakers_highlights" USING btree ("_parent_id");
  CREATE INDEX "page_home_previous_speakers_stand_ins_order_idx" ON "page_home_previous_speakers_stand_ins" USING btree ("_order");
  CREATE INDEX "page_home_previous_speakers_stand_ins_parent_id_idx" ON "page_home_previous_speakers_stand_ins" USING btree ("_parent_id");
  CREATE INDEX "page_home_social_posts_order_idx" ON "page_home_social_posts" USING btree ("_order");
  CREATE INDEX "page_home_social_posts_parent_id_idx" ON "page_home_social_posts" USING btree ("_parent_id");
  CREATE INDEX "page_home_social_posts_image_idx" ON "page_home_social_posts" USING btree ("image_id");
  CREATE INDEX "_page_home_v_version_hero_lead_lines_order_idx" ON "_page_home_v_version_hero_lead_lines" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_hero_lead_lines_parent_id_idx" ON "_page_home_v_version_hero_lead_lines" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_previous_speakers_highlights_order_idx" ON "_page_home_v_version_previous_speakers_highlights" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_previous_speakers_highlights_parent_id_idx" ON "_page_home_v_version_previous_speakers_highlights" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_previous_speakers_stand_ins_order_idx" ON "_page_home_v_version_previous_speakers_stand_ins" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_previous_speakers_stand_ins_parent_id_idx" ON "_page_home_v_version_previous_speakers_stand_ins" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_social_posts_order_idx" ON "_page_home_v_version_social_posts" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_social_posts_parent_id_idx" ON "_page_home_v_version_social_posts" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_social_posts_image_idx" ON "_page_home_v_version_social_posts" USING btree ("image_id");
  CREATE INDEX "site_settings_nav_children_order_idx" ON "site_settings_nav_children" USING btree ("_order");
  CREATE INDEX "site_settings_nav_children_parent_id_idx" ON "site_settings_nav_children" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_nav_children_order_idx" ON "_site_settings_v_version_nav_children" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_nav_children_parent_id_idx" ON "_site_settings_v_version_nav_children" USING btree ("_parent_id");
  ALTER TABLE "page_home_why_attend_cards" ADD CONSTRAINT "page_home_why_attend_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_why_attend_cards" ADD CONSTRAINT "_page_home_v_version_why_attend_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "page_home_why_attend_cards_image_idx" ON "page_home_why_attend_cards" USING btree ("image_id");
  CREATE INDEX "_page_home_v_version_why_attend_cards_image_idx" ON "_page_home_v_version_why_attend_cards" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_home_hero_lead_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_home_previous_speakers_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_home_previous_speakers_stand_ins" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_home_social_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_home_v_version_hero_lead_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_home_v_version_previous_speakers_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_home_v_version_previous_speakers_stand_ins" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_home_v_version_social_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_nav_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_nav_children" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "page_home_hero_lead_lines" CASCADE;
  DROP TABLE "page_home_previous_speakers_highlights" CASCADE;
  DROP TABLE "page_home_previous_speakers_stand_ins" CASCADE;
  DROP TABLE "page_home_social_posts" CASCADE;
  DROP TABLE "_page_home_v_version_hero_lead_lines" CASCADE;
  DROP TABLE "_page_home_v_version_previous_speakers_highlights" CASCADE;
  DROP TABLE "_page_home_v_version_previous_speakers_stand_ins" CASCADE;
  DROP TABLE "_page_home_v_version_social_posts" CASCADE;
  DROP TABLE "site_settings_nav_children" CASCADE;
  DROP TABLE "_site_settings_v_version_nav_children" CASCADE;
  ALTER TABLE "page_home_why_attend_cards" DROP CONSTRAINT "page_home_why_attend_cards_image_id_media_id_fk";
  
  ALTER TABLE "_page_home_v_version_why_attend_cards" DROP CONSTRAINT "_page_home_v_version_why_attend_cards_image_id_media_id_fk";
  
  DROP INDEX "page_home_why_attend_cards_image_idx";
  DROP INDEX "_page_home_v_version_why_attend_cards_image_idx";
  ALTER TABLE "page_home_partner_band_items" DROP COLUMN "description";
  ALTER TABLE "page_home_why_attend_cards" DROP COLUMN "eyebrow";
  ALTER TABLE "page_home_why_attend_cards" DROP COLUMN "href";
  ALTER TABLE "page_home_why_attend_cards" DROP COLUMN "link_label";
  ALTER TABLE "page_home_why_attend_cards" DROP COLUMN "image_id";
  ALTER TABLE "page_home_why_attend_cards" DROP COLUMN "image_alt";
  ALTER TABLE "page_home" DROP COLUMN "hero_badge";
  ALTER TABLE "page_home" DROP COLUMN "countdown_label";
  ALTER TABLE "page_home" DROP COLUMN "countdown_days_label";
  ALTER TABLE "page_home" DROP COLUMN "countdown_hours_label";
  ALTER TABLE "page_home" DROP COLUMN "countdown_minutes_label";
  ALTER TABLE "page_home" DROP COLUMN "countdown_seconds_label";
  ALTER TABLE "page_home" DROP COLUMN "countdown_spoken_label";
  ALTER TABLE "page_home" DROP COLUMN "countdown_live_label";
  ALTER TABLE "page_home" DROP COLUMN "partner_band_eyebrow";
  ALTER TABLE "page_home" DROP COLUMN "partner_band_heading";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_eyebrow";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_alumni_label";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_lineup_label";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_lineup_year";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_lineup_slots";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_lineup_show_placeholders";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_lineup_placeholder_name";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_lineup_placeholder_role";
  ALTER TABLE "page_home" DROP COLUMN "previous_speakers_stand_in_label";
  ALTER TABLE "page_home" DROP COLUMN "why_attend_eyebrow";
  ALTER TABLE "page_home" DROP COLUMN "social_eyebrow";
  ALTER TABLE "page_home" DROP COLUMN "social_heading";
  ALTER TABLE "page_home" DROP COLUMN "social_intro";
  ALTER TABLE "page_home" DROP COLUMN "social_linkedin_label";
  ALTER TABLE "page_home" DROP COLUMN "social_instagram_label";
  ALTER TABLE "_page_home_v_version_partner_band_items" DROP COLUMN "description";
  ALTER TABLE "_page_home_v_version_why_attend_cards" DROP COLUMN "eyebrow";
  ALTER TABLE "_page_home_v_version_why_attend_cards" DROP COLUMN "href";
  ALTER TABLE "_page_home_v_version_why_attend_cards" DROP COLUMN "link_label";
  ALTER TABLE "_page_home_v_version_why_attend_cards" DROP COLUMN "image_id";
  ALTER TABLE "_page_home_v_version_why_attend_cards" DROP COLUMN "image_alt";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_hero_badge";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_countdown_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_countdown_days_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_countdown_hours_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_countdown_minutes_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_countdown_seconds_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_countdown_spoken_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_countdown_live_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_partner_band_eyebrow";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_partner_band_heading";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_eyebrow";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_alumni_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_lineup_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_lineup_year";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_lineup_slots";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_lineup_show_placeholders";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_lineup_placeholder_name";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_lineup_placeholder_role";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_previous_speakers_stand_in_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_why_attend_eyebrow";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_social_eyebrow";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_social_heading";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_social_intro";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_social_linkedin_label";
  ALTER TABLE "_page_home_v" DROP COLUMN "version_social_instagram_label";
  DROP TYPE "public"."enum_page_home_social_posts_platform";
  DROP TYPE "public"."enum__page_home_v_version_social_posts_platform";`)
}
