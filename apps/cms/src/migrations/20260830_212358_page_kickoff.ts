import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Join Q / Kickoff page global plus Site Settings kickoff switches.
 * Generated SQL, minus team.email / _team_v.version_email (already added by
 * 20260731_120000_team_email; that hand migration has no drizzle snapshot).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_kickoff_socials_links_icon" AS ENUM('linkedin', 'instagram', 'tiktok', 'whatsapp');
  CREATE TYPE "public"."enum_page_kickoff_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_kickoff_v_version_socials_links_icon" AS ENUM('linkedin', 'instagram', 'tiktok', 'whatsapp');
  CREATE TYPE "public"."enum__page_kickoff_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "page_kickoff_kickoff_speakers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"linkedin" varchar,
  	"image_id" integer,
  	"image_alt" varchar
  );
  
  CREATE TABLE "page_kickoff_socials_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"icon" "enum_page_kickoff_socials_links_icon",
  	"href" varchar
  );
  
  CREATE TABLE "page_kickoff_quiz_questions_answers_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_kickoff_quiz_questions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"answer_id" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "page_kickoff_quiz_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"question" varchar
  );
  
  CREATE TABLE "page_kickoff_quiz_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"team" varchar,
  	"text" varchar,
  	"notion_href" varchar
  );
  
  CREATE TABLE "page_kickoff_journey_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"image_alt" varchar
  );
  
  CREATE TABLE "page_kickoff_application_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "page_kickoff" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar,
  	"hero_headline" varchar,
  	"hero_copy" varchar,
  	"hero_image_id" integer,
  	"hero_image_alt" varchar,
  	"hero_primary_cta_label" varchar,
  	"hero_primary_cta_href" varchar,
  	"hero_secondary_cta_label" varchar,
  	"hero_secondary_cta_href" varchar,
  	"kickoff_eyebrow" varchar,
  	"kickoff_heading" varchar,
  	"kickoff_intro" varchar,
  	"kickoff_date" varchar,
  	"kickoff_location" varchar,
  	"kickoff_panel_title" varchar,
  	"kickoff_ui_speaker_label" varchar,
  	"kickoff_ui_linkedin_label" varchar,
  	"kickoff_ui_kickoff_label" varchar,
  	"kickoff_ui_panel_label" varchar,
  	"kickoff_company_name" varchar,
  	"kickoff_company_href" varchar,
  	"kickoff_company_logo_id" integer,
  	"kickoff_company_logo_alt" varchar,
  	"socials_eyebrow" varchar,
  	"socials_heading" varchar,
  	"quiz_eyebrow" varchar,
  	"quiz_heading" varchar,
  	"quiz_intro" varchar,
  	"quiz_ui_question_label" varchar,
  	"quiz_ui_of_label" varchar,
  	"quiz_ui_back_label" varchar,
  	"quiz_ui_next_label" varchar,
  	"quiz_ui_show_result_label" varchar,
  	"quiz_ui_place_label" varchar,
  	"quiz_ui_team_link_label" varchar,
  	"quiz_start_eyebrow" varchar,
  	"quiz_start_heading" varchar,
  	"quiz_start_copy" varchar,
  	"quiz_start_button_label" varchar,
  	"quiz_result_copy_eyebrow" varchar,
  	"quiz_result_copy_heading" varchar,
  	"quiz_result_copy_copy" varchar,
  	"quiz_result_copy_restart_label" varchar,
  	"quiz_result_copy_application_cta_label" varchar,
  	"quiz_result_copy_application_cta_href" varchar,
  	"quiz_result_copy_all_teams_cta_label" varchar,
  	"quiz_result_copy_all_teams_cta_href" varchar,
  	"journey_eyebrow" varchar,
  	"journey_heading" varchar,
  	"journey_intro" varchar,
  	"journey_hint" varchar,
  	"application_eyebrow" varchar,
  	"application_heading" varchar,
  	"application_intro" varchar,
  	"application_is_open" boolean DEFAULT false,
  	"application_application_url" varchar,
  	"application_coming_soon_label" varchar DEFAULT 'Coming Soon',
  	"final_cta_eyebrow" varchar,
  	"final_cta_heading" varchar,
  	"final_cta_copy" varchar,
  	"final_cta_cta_label" varchar,
  	"final_cta_cta_href" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_kickoff_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_kickoff_v_version_kickoff_speakers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"linkedin" varchar,
  	"image_id" integer,
  	"image_alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_kickoff_v_version_socials_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"icon" "enum__page_kickoff_v_version_socials_links_icon",
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_kickoff_v_version_quiz_questions_answers_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_kickoff_v_version_quiz_questions_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"answer_id" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_kickoff_v_version_quiz_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"question" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_kickoff_v_version_quiz_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"team" varchar,
  	"text" varchar,
  	"notion_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_kickoff_v_version_journey_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"image_alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_kickoff_v_version_application_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_kickoff_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_eyebrow" varchar,
  	"version_hero_headline" varchar,
  	"version_hero_copy" varchar,
  	"version_hero_image_id" integer,
  	"version_hero_image_alt" varchar,
  	"version_hero_primary_cta_label" varchar,
  	"version_hero_primary_cta_href" varchar,
  	"version_hero_secondary_cta_label" varchar,
  	"version_hero_secondary_cta_href" varchar,
  	"version_kickoff_eyebrow" varchar,
  	"version_kickoff_heading" varchar,
  	"version_kickoff_intro" varchar,
  	"version_kickoff_date" varchar,
  	"version_kickoff_location" varchar,
  	"version_kickoff_panel_title" varchar,
  	"version_kickoff_ui_speaker_label" varchar,
  	"version_kickoff_ui_linkedin_label" varchar,
  	"version_kickoff_ui_kickoff_label" varchar,
  	"version_kickoff_ui_panel_label" varchar,
  	"version_kickoff_company_name" varchar,
  	"version_kickoff_company_href" varchar,
  	"version_kickoff_company_logo_id" integer,
  	"version_kickoff_company_logo_alt" varchar,
  	"version_socials_eyebrow" varchar,
  	"version_socials_heading" varchar,
  	"version_quiz_eyebrow" varchar,
  	"version_quiz_heading" varchar,
  	"version_quiz_intro" varchar,
  	"version_quiz_ui_question_label" varchar,
  	"version_quiz_ui_of_label" varchar,
  	"version_quiz_ui_back_label" varchar,
  	"version_quiz_ui_next_label" varchar,
  	"version_quiz_ui_show_result_label" varchar,
  	"version_quiz_ui_place_label" varchar,
  	"version_quiz_ui_team_link_label" varchar,
  	"version_quiz_start_eyebrow" varchar,
  	"version_quiz_start_heading" varchar,
  	"version_quiz_start_copy" varchar,
  	"version_quiz_start_button_label" varchar,
  	"version_quiz_result_copy_eyebrow" varchar,
  	"version_quiz_result_copy_heading" varchar,
  	"version_quiz_result_copy_copy" varchar,
  	"version_quiz_result_copy_restart_label" varchar,
  	"version_quiz_result_copy_application_cta_label" varchar,
  	"version_quiz_result_copy_application_cta_href" varchar,
  	"version_quiz_result_copy_all_teams_cta_label" varchar,
  	"version_quiz_result_copy_all_teams_cta_href" varchar,
  	"version_journey_eyebrow" varchar,
  	"version_journey_heading" varchar,
  	"version_journey_intro" varchar,
  	"version_journey_hint" varchar,
  	"version_application_eyebrow" varchar,
  	"version_application_heading" varchar,
  	"version_application_intro" varchar,
  	"version_application_is_open" boolean DEFAULT false,
  	"version_application_application_url" varchar,
  	"version_application_coming_soon_label" varchar DEFAULT 'Coming Soon',
  	"version_final_cta_eyebrow" varchar,
  	"version_final_cta_heading" varchar,
  	"version_final_cta_copy" varchar,
  	"version_final_cta_cta_label" varchar,
  	"version_final_cta_cta_href" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_kickoff_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "kickoff_page_enabled" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "kickoff_redirect_root" boolean DEFAULT false;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_kickoff_page_enabled" boolean DEFAULT false;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_kickoff_redirect_root" boolean DEFAULT false;
  ALTER TABLE "page_kickoff_kickoff_speakers" ADD CONSTRAINT "page_kickoff_kickoff_speakers_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_kickoff_kickoff_speakers" ADD CONSTRAINT "page_kickoff_kickoff_speakers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kickoff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kickoff_socials_links" ADD CONSTRAINT "page_kickoff_socials_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kickoff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kickoff_quiz_questions_answers_tags" ADD CONSTRAINT "page_kickoff_quiz_questions_answers_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kickoff_quiz_questions_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kickoff_quiz_questions_answers" ADD CONSTRAINT "page_kickoff_quiz_questions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kickoff_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kickoff_quiz_questions" ADD CONSTRAINT "page_kickoff_quiz_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kickoff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kickoff_quiz_results" ADD CONSTRAINT "page_kickoff_quiz_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kickoff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kickoff_journey_moments" ADD CONSTRAINT "page_kickoff_journey_moments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_kickoff_journey_moments" ADD CONSTRAINT "page_kickoff_journey_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kickoff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kickoff_application_steps" ADD CONSTRAINT "page_kickoff_application_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kickoff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kickoff" ADD CONSTRAINT "page_kickoff_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_kickoff" ADD CONSTRAINT "page_kickoff_kickoff_company_logo_id_media_id_fk" FOREIGN KEY ("kickoff_company_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" ADD CONSTRAINT "_page_kickoff_v_version_kickoff_speakers_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" ADD CONSTRAINT "_page_kickoff_v_version_kickoff_speakers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_kickoff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_socials_links" ADD CONSTRAINT "_page_kickoff_v_version_socials_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_kickoff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_quiz_questions_answers_tags" ADD CONSTRAINT "_page_kickoff_v_version_quiz_questions_answers_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_kickoff_v_version_quiz_questions_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_quiz_questions_answers" ADD CONSTRAINT "_page_kickoff_v_version_quiz_questions_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_kickoff_v_version_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_quiz_questions" ADD CONSTRAINT "_page_kickoff_v_version_quiz_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_kickoff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_quiz_results" ADD CONSTRAINT "_page_kickoff_v_version_quiz_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_kickoff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_journey_moments" ADD CONSTRAINT "_page_kickoff_v_version_journey_moments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_journey_moments" ADD CONSTRAINT "_page_kickoff_v_version_journey_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_kickoff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v_version_application_steps" ADD CONSTRAINT "_page_kickoff_v_version_application_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_kickoff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v" ADD CONSTRAINT "_page_kickoff_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_kickoff_v" ADD CONSTRAINT "_page_kickoff_v_version_kickoff_company_logo_id_media_id_fk" FOREIGN KEY ("version_kickoff_company_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "page_kickoff_kickoff_speakers_order_idx" ON "page_kickoff_kickoff_speakers" USING btree ("_order");
  CREATE INDEX "page_kickoff_kickoff_speakers_parent_id_idx" ON "page_kickoff_kickoff_speakers" USING btree ("_parent_id");
  CREATE INDEX "page_kickoff_kickoff_speakers_image_idx" ON "page_kickoff_kickoff_speakers" USING btree ("image_id");
  CREATE INDEX "page_kickoff_socials_links_order_idx" ON "page_kickoff_socials_links" USING btree ("_order");
  CREATE INDEX "page_kickoff_socials_links_parent_id_idx" ON "page_kickoff_socials_links" USING btree ("_parent_id");
  CREATE INDEX "page_kickoff_quiz_questions_answers_tags_order_idx" ON "page_kickoff_quiz_questions_answers_tags" USING btree ("_order");
  CREATE INDEX "page_kickoff_quiz_questions_answers_tags_parent_id_idx" ON "page_kickoff_quiz_questions_answers_tags" USING btree ("_parent_id");
  CREATE INDEX "page_kickoff_quiz_questions_answers_order_idx" ON "page_kickoff_quiz_questions_answers" USING btree ("_order");
  CREATE INDEX "page_kickoff_quiz_questions_answers_parent_id_idx" ON "page_kickoff_quiz_questions_answers" USING btree ("_parent_id");
  CREATE INDEX "page_kickoff_quiz_questions_order_idx" ON "page_kickoff_quiz_questions" USING btree ("_order");
  CREATE INDEX "page_kickoff_quiz_questions_parent_id_idx" ON "page_kickoff_quiz_questions" USING btree ("_parent_id");
  CREATE INDEX "page_kickoff_quiz_results_order_idx" ON "page_kickoff_quiz_results" USING btree ("_order");
  CREATE INDEX "page_kickoff_quiz_results_parent_id_idx" ON "page_kickoff_quiz_results" USING btree ("_parent_id");
  CREATE INDEX "page_kickoff_journey_moments_order_idx" ON "page_kickoff_journey_moments" USING btree ("_order");
  CREATE INDEX "page_kickoff_journey_moments_parent_id_idx" ON "page_kickoff_journey_moments" USING btree ("_parent_id");
  CREATE INDEX "page_kickoff_journey_moments_image_idx" ON "page_kickoff_journey_moments" USING btree ("image_id");
  CREATE INDEX "page_kickoff_application_steps_order_idx" ON "page_kickoff_application_steps" USING btree ("_order");
  CREATE INDEX "page_kickoff_application_steps_parent_id_idx" ON "page_kickoff_application_steps" USING btree ("_parent_id");
  CREATE INDEX "page_kickoff_hero_hero_image_idx" ON "page_kickoff" USING btree ("hero_image_id");
  CREATE INDEX "page_kickoff_kickoff_company_kickoff_company_logo_idx" ON "page_kickoff" USING btree ("kickoff_company_logo_id");
  CREATE INDEX "page_kickoff__status_idx" ON "page_kickoff" USING btree ("_status");
  CREATE INDEX "_page_kickoff_v_version_kickoff_speakers_order_idx" ON "_page_kickoff_v_version_kickoff_speakers" USING btree ("_order");
  CREATE INDEX "_page_kickoff_v_version_kickoff_speakers_parent_id_idx" ON "_page_kickoff_v_version_kickoff_speakers" USING btree ("_parent_id");
  CREATE INDEX "_page_kickoff_v_version_kickoff_speakers_image_idx" ON "_page_kickoff_v_version_kickoff_speakers" USING btree ("image_id");
  CREATE INDEX "_page_kickoff_v_version_socials_links_order_idx" ON "_page_kickoff_v_version_socials_links" USING btree ("_order");
  CREATE INDEX "_page_kickoff_v_version_socials_links_parent_id_idx" ON "_page_kickoff_v_version_socials_links" USING btree ("_parent_id");
  CREATE INDEX "_page_kickoff_v_version_quiz_questions_answers_tags_order_idx" ON "_page_kickoff_v_version_quiz_questions_answers_tags" USING btree ("_order");
  CREATE INDEX "_page_kickoff_v_version_quiz_questions_answers_tags_parent_id_idx" ON "_page_kickoff_v_version_quiz_questions_answers_tags" USING btree ("_parent_id");
  CREATE INDEX "_page_kickoff_v_version_quiz_questions_answers_order_idx" ON "_page_kickoff_v_version_quiz_questions_answers" USING btree ("_order");
  CREATE INDEX "_page_kickoff_v_version_quiz_questions_answers_parent_id_idx" ON "_page_kickoff_v_version_quiz_questions_answers" USING btree ("_parent_id");
  CREATE INDEX "_page_kickoff_v_version_quiz_questions_order_idx" ON "_page_kickoff_v_version_quiz_questions" USING btree ("_order");
  CREATE INDEX "_page_kickoff_v_version_quiz_questions_parent_id_idx" ON "_page_kickoff_v_version_quiz_questions" USING btree ("_parent_id");
  CREATE INDEX "_page_kickoff_v_version_quiz_results_order_idx" ON "_page_kickoff_v_version_quiz_results" USING btree ("_order");
  CREATE INDEX "_page_kickoff_v_version_quiz_results_parent_id_idx" ON "_page_kickoff_v_version_quiz_results" USING btree ("_parent_id");
  CREATE INDEX "_page_kickoff_v_version_journey_moments_order_idx" ON "_page_kickoff_v_version_journey_moments" USING btree ("_order");
  CREATE INDEX "_page_kickoff_v_version_journey_moments_parent_id_idx" ON "_page_kickoff_v_version_journey_moments" USING btree ("_parent_id");
  CREATE INDEX "_page_kickoff_v_version_journey_moments_image_idx" ON "_page_kickoff_v_version_journey_moments" USING btree ("image_id");
  CREATE INDEX "_page_kickoff_v_version_application_steps_order_idx" ON "_page_kickoff_v_version_application_steps" USING btree ("_order");
  CREATE INDEX "_page_kickoff_v_version_application_steps_parent_id_idx" ON "_page_kickoff_v_version_application_steps" USING btree ("_parent_id");
  CREATE INDEX "_page_kickoff_v_version_hero_version_hero_image_idx" ON "_page_kickoff_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_page_kickoff_v_version_kickoff_company_version_kickoff__idx" ON "_page_kickoff_v" USING btree ("version_kickoff_company_logo_id");
  CREATE INDEX "_page_kickoff_v_version_version__status_idx" ON "_page_kickoff_v" USING btree ("version__status");
  CREATE INDEX "_page_kickoff_v_created_at_idx" ON "_page_kickoff_v" USING btree ("created_at");
  CREATE INDEX "_page_kickoff_v_updated_at_idx" ON "_page_kickoff_v" USING btree ("updated_at");
  CREATE INDEX "_page_kickoff_v_latest_idx" ON "_page_kickoff_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_kickoff_kickoff_speakers" CASCADE;
  DROP TABLE "page_kickoff_socials_links" CASCADE;
  DROP TABLE "page_kickoff_quiz_questions_answers_tags" CASCADE;
  DROP TABLE "page_kickoff_quiz_questions_answers" CASCADE;
  DROP TABLE "page_kickoff_quiz_questions" CASCADE;
  DROP TABLE "page_kickoff_quiz_results" CASCADE;
  DROP TABLE "page_kickoff_journey_moments" CASCADE;
  DROP TABLE "page_kickoff_application_steps" CASCADE;
  DROP TABLE "page_kickoff" CASCADE;
  DROP TABLE "_page_kickoff_v_version_kickoff_speakers" CASCADE;
  DROP TABLE "_page_kickoff_v_version_socials_links" CASCADE;
  DROP TABLE "_page_kickoff_v_version_quiz_questions_answers_tags" CASCADE;
  DROP TABLE "_page_kickoff_v_version_quiz_questions_answers" CASCADE;
  DROP TABLE "_page_kickoff_v_version_quiz_questions" CASCADE;
  DROP TABLE "_page_kickoff_v_version_quiz_results" CASCADE;
  DROP TABLE "_page_kickoff_v_version_journey_moments" CASCADE;
  DROP TABLE "_page_kickoff_v_version_application_steps" CASCADE;
  DROP TABLE "_page_kickoff_v" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "kickoff_page_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "kickoff_redirect_root";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_kickoff_page_enabled";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_kickoff_redirect_root";
  DROP TYPE "public"."enum_page_kickoff_socials_links_icon";
  DROP TYPE "public"."enum_page_kickoff_status";
  DROP TYPE "public"."enum__page_kickoff_v_version_socials_links_icon";
  DROP TYPE "public"."enum__page_kickoff_v_version_status";`)
}
