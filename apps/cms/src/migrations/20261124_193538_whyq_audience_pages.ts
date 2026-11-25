import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_whyq_pages_activities_items_kind" AS ENUM('included', 'apply');
  CREATE TYPE "public"."enum_page_whyq_pages_ticket_keys" AS ENUM('student', 'young-professional', 'start-up', 'investor', 'corporate');
  CREATE TYPE "public"."enum_page_whyq_pages_audience" AS ENUM('students', 'startups', 'corporates', 'investors');
  CREATE TYPE "public"."enum_page_whyq_pages_highlight_layout" AS ENUM('cards', 'winner', 'logos', 'qube');
  CREATE TYPE "public"."enum__page_whyq_v_version_pages_activities_items_kind" AS ENUM('included', 'apply');
  CREATE TYPE "public"."enum__page_whyq_v_version_pages_ticket_keys" AS ENUM('student', 'young-professional', 'start-up', 'investor', 'corporate');
  CREATE TYPE "public"."enum__page_whyq_v_version_pages_audience" AS ENUM('students', 'startups', 'corporates', 'investors');
  CREATE TYPE "public"."enum__page_whyq_v_version_pages_highlight_layout" AS ENUM('cards', 'winner', 'logos', 'qube');
  CREATE TABLE "page_whyq_pages_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "page_whyq_pages_activities_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"kind" "enum_page_whyq_pages_activities_items_kind" DEFAULT 'included',
  	"image_id" integer,
  	"image_alt" varchar
  );
  
  CREATE TABLE "page_whyq_pages_highlight_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"image_alt" varchar
  );
  
  CREATE TABLE "page_whyq_pages_highlight_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_alt" varchar
  );
  
  CREATE TABLE "page_whyq_pages_highlight_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"website_url" varchar,
  	"logo_id" integer
  );
  
  CREATE TABLE "page_whyq_pages_ticket_keys" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_page_whyq_pages_ticket_keys",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "page_whyq_pages_ticket_side" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"status" varchar
  );
  
  CREATE TABLE "page_whyq_pages_ticket_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_whyq_pages_ticket_partner_panel_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_whyq_pages_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "page_whyq_pages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"audience" "enum_page_whyq_pages_audience",
  	"crumb" varchar,
  	"meta_description" varchar,
  	"hero_heading" varchar,
  	"hero_intro" varchar,
  	"hero_cta_label" varchar,
  	"activities_heading" varchar,
  	"activities_intro" varchar,
  	"highlight_layout" "enum_page_whyq_pages_highlight_layout" DEFAULT 'cards',
  	"highlight_eyebrow" varchar,
  	"highlight_heading" varchar,
  	"highlight_intro" varchar,
  	"highlight_winner_label" varchar,
  	"highlight_winner_name" varchar,
  	"highlight_winner_line" varchar,
  	"highlight_image_id" integer,
  	"highlight_image_alt" varchar,
  	"highlight_logos_eyebrow" varchar,
  	"highlight_logos_heading" varchar,
  	"ticket_heading" varchar,
  	"ticket_intro" varchar,
  	"ticket_includes_heading" varchar,
  	"ticket_partner_panel_eyebrow" varchar,
  	"ticket_partner_panel_heading" varchar,
  	"ticket_partner_panel_text" varchar,
  	"ticket_partner_panel_link_label" varchar,
  	"ticket_partner_panel_href" varchar,
  	"faq_heading" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_activities_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"kind" "enum__page_whyq_v_version_pages_activities_items_kind" DEFAULT 'included',
  	"image_id" integer,
  	"image_alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_highlight_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"image_alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_highlight_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_highlight_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"website_url" varchar,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_ticket_keys" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__page_whyq_v_version_pages_ticket_keys",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_ticket_side" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"status" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_ticket_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_ticket_partner_panel_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_pages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"audience" "enum__page_whyq_v_version_pages_audience",
  	"crumb" varchar,
  	"meta_description" varchar,
  	"hero_heading" varchar,
  	"hero_intro" varchar,
  	"hero_cta_label" varchar,
  	"activities_heading" varchar,
  	"activities_intro" varchar,
  	"highlight_layout" "enum__page_whyq_v_version_pages_highlight_layout" DEFAULT 'cards',
  	"highlight_eyebrow" varchar,
  	"highlight_heading" varchar,
  	"highlight_intro" varchar,
  	"highlight_winner_label" varchar,
  	"highlight_winner_name" varchar,
  	"highlight_winner_line" varchar,
  	"highlight_image_id" integer,
  	"highlight_image_alt" varchar,
  	"highlight_logos_eyebrow" varchar,
  	"highlight_logos_heading" varchar,
  	"ticket_heading" varchar,
  	"ticket_intro" varchar,
  	"ticket_includes_heading" varchar,
  	"ticket_partner_panel_eyebrow" varchar,
  	"ticket_partner_panel_heading" varchar,
  	"ticket_partner_panel_text" varchar,
  	"ticket_partner_panel_link_label" varchar,
  	"ticket_partner_panel_href" varchar,
  	"faq_heading" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "page_whyq" ADD COLUMN "event_line" varchar;
  ALTER TABLE "_page_whyq_v" ADD COLUMN "version_event_line" varchar;
  ALTER TABLE "page_whyq_pages_stats" ADD CONSTRAINT "page_whyq_pages_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_activities_items" ADD CONSTRAINT "page_whyq_pages_activities_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_activities_items" ADD CONSTRAINT "page_whyq_pages_activities_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_highlight_cards" ADD CONSTRAINT "page_whyq_pages_highlight_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_highlight_cards" ADD CONSTRAINT "page_whyq_pages_highlight_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_highlight_moments" ADD CONSTRAINT "page_whyq_pages_highlight_moments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_highlight_moments" ADD CONSTRAINT "page_whyq_pages_highlight_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_highlight_logos" ADD CONSTRAINT "page_whyq_pages_highlight_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_highlight_logos" ADD CONSTRAINT "page_whyq_pages_highlight_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_ticket_keys" ADD CONSTRAINT "page_whyq_pages_ticket_keys_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_ticket_side" ADD CONSTRAINT "page_whyq_pages_ticket_side_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_ticket_includes" ADD CONSTRAINT "page_whyq_pages_ticket_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_ticket_partner_panel_perks" ADD CONSTRAINT "page_whyq_pages_ticket_partner_panel_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages_faq_items" ADD CONSTRAINT "page_whyq_pages_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_pages" ADD CONSTRAINT "page_whyq_pages_highlight_image_id_media_id_fk" FOREIGN KEY ("highlight_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_whyq_pages" ADD CONSTRAINT "page_whyq_pages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_stats" ADD CONSTRAINT "_page_whyq_v_version_pages_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_activities_items" ADD CONSTRAINT "_page_whyq_v_version_pages_activities_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_activities_items" ADD CONSTRAINT "_page_whyq_v_version_pages_activities_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_highlight_cards" ADD CONSTRAINT "_page_whyq_v_version_pages_highlight_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_highlight_cards" ADD CONSTRAINT "_page_whyq_v_version_pages_highlight_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_highlight_moments" ADD CONSTRAINT "_page_whyq_v_version_pages_highlight_moments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_highlight_moments" ADD CONSTRAINT "_page_whyq_v_version_pages_highlight_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_highlight_logos" ADD CONSTRAINT "_page_whyq_v_version_pages_highlight_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_highlight_logos" ADD CONSTRAINT "_page_whyq_v_version_pages_highlight_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_ticket_keys" ADD CONSTRAINT "_page_whyq_v_version_pages_ticket_keys_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_ticket_side" ADD CONSTRAINT "_page_whyq_v_version_pages_ticket_side_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_ticket_includes" ADD CONSTRAINT "_page_whyq_v_version_pages_ticket_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_ticket_partner_panel_perks" ADD CONSTRAINT "_page_whyq_v_version_pages_ticket_partner_panel_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages_faq_items" ADD CONSTRAINT "_page_whyq_v_version_pages_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages" ADD CONSTRAINT "_page_whyq_v_version_pages_highlight_image_id_media_id_fk" FOREIGN KEY ("highlight_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_pages" ADD CONSTRAINT "_page_whyq_v_version_pages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_whyq_pages_stats_order_idx" ON "page_whyq_pages_stats" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_stats_parent_id_idx" ON "page_whyq_pages_stats" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_activities_items_order_idx" ON "page_whyq_pages_activities_items" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_activities_items_parent_id_idx" ON "page_whyq_pages_activities_items" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_activities_items_image_idx" ON "page_whyq_pages_activities_items" USING btree ("image_id");
  CREATE INDEX "page_whyq_pages_highlight_cards_order_idx" ON "page_whyq_pages_highlight_cards" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_highlight_cards_parent_id_idx" ON "page_whyq_pages_highlight_cards" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_highlight_cards_image_idx" ON "page_whyq_pages_highlight_cards" USING btree ("image_id");
  CREATE INDEX "page_whyq_pages_highlight_moments_order_idx" ON "page_whyq_pages_highlight_moments" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_highlight_moments_parent_id_idx" ON "page_whyq_pages_highlight_moments" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_highlight_moments_image_idx" ON "page_whyq_pages_highlight_moments" USING btree ("image_id");
  CREATE INDEX "page_whyq_pages_highlight_logos_order_idx" ON "page_whyq_pages_highlight_logos" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_highlight_logos_parent_id_idx" ON "page_whyq_pages_highlight_logos" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_highlight_logos_logo_idx" ON "page_whyq_pages_highlight_logos" USING btree ("logo_id");
  CREATE INDEX "page_whyq_pages_ticket_keys_order_idx" ON "page_whyq_pages_ticket_keys" USING btree ("order");
  CREATE INDEX "page_whyq_pages_ticket_keys_parent_idx" ON "page_whyq_pages_ticket_keys" USING btree ("parent_id");
  CREATE INDEX "page_whyq_pages_ticket_side_order_idx" ON "page_whyq_pages_ticket_side" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_ticket_side_parent_id_idx" ON "page_whyq_pages_ticket_side" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_ticket_includes_order_idx" ON "page_whyq_pages_ticket_includes" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_ticket_includes_parent_id_idx" ON "page_whyq_pages_ticket_includes" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_ticket_partner_panel_perks_order_idx" ON "page_whyq_pages_ticket_partner_panel_perks" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_ticket_partner_panel_perks_parent_id_idx" ON "page_whyq_pages_ticket_partner_panel_perks" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_faq_items_order_idx" ON "page_whyq_pages_faq_items" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_faq_items_parent_id_idx" ON "page_whyq_pages_faq_items" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_order_idx" ON "page_whyq_pages" USING btree ("_order");
  CREATE INDEX "page_whyq_pages_parent_id_idx" ON "page_whyq_pages" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_pages_highlight_highlight_image_idx" ON "page_whyq_pages" USING btree ("highlight_image_id");
  CREATE INDEX "_page_whyq_v_version_pages_stats_order_idx" ON "_page_whyq_v_version_pages_stats" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_stats_parent_id_idx" ON "_page_whyq_v_version_pages_stats" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_activities_items_order_idx" ON "_page_whyq_v_version_pages_activities_items" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_activities_items_parent_id_idx" ON "_page_whyq_v_version_pages_activities_items" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_activities_items_image_idx" ON "_page_whyq_v_version_pages_activities_items" USING btree ("image_id");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_cards_order_idx" ON "_page_whyq_v_version_pages_highlight_cards" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_cards_parent_id_idx" ON "_page_whyq_v_version_pages_highlight_cards" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_cards_image_idx" ON "_page_whyq_v_version_pages_highlight_cards" USING btree ("image_id");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_moments_order_idx" ON "_page_whyq_v_version_pages_highlight_moments" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_moments_parent_id_idx" ON "_page_whyq_v_version_pages_highlight_moments" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_moments_image_idx" ON "_page_whyq_v_version_pages_highlight_moments" USING btree ("image_id");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_logos_order_idx" ON "_page_whyq_v_version_pages_highlight_logos" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_logos_parent_id_idx" ON "_page_whyq_v_version_pages_highlight_logos" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_logos_logo_idx" ON "_page_whyq_v_version_pages_highlight_logos" USING btree ("logo_id");
  CREATE INDEX "_page_whyq_v_version_pages_ticket_keys_order_idx" ON "_page_whyq_v_version_pages_ticket_keys" USING btree ("order");
  CREATE INDEX "_page_whyq_v_version_pages_ticket_keys_parent_idx" ON "_page_whyq_v_version_pages_ticket_keys" USING btree ("parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_ticket_side_order_idx" ON "_page_whyq_v_version_pages_ticket_side" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_ticket_side_parent_id_idx" ON "_page_whyq_v_version_pages_ticket_side" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_ticket_includes_order_idx" ON "_page_whyq_v_version_pages_ticket_includes" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_ticket_includes_parent_id_idx" ON "_page_whyq_v_version_pages_ticket_includes" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_ticket_partner_panel_perks_order_idx" ON "_page_whyq_v_version_pages_ticket_partner_panel_perks" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_ticket_partner_panel_perks_parent_id_idx" ON "_page_whyq_v_version_pages_ticket_partner_panel_perks" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_faq_items_order_idx" ON "_page_whyq_v_version_pages_faq_items" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_faq_items_parent_id_idx" ON "_page_whyq_v_version_pages_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_order_idx" ON "_page_whyq_v_version_pages" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_pages_parent_id_idx" ON "_page_whyq_v_version_pages" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_pages_highlight_highlight_image_idx" ON "_page_whyq_v_version_pages" USING btree ("highlight_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_whyq_pages_stats" CASCADE;
  DROP TABLE "page_whyq_pages_activities_items" CASCADE;
  DROP TABLE "page_whyq_pages_highlight_cards" CASCADE;
  DROP TABLE "page_whyq_pages_highlight_moments" CASCADE;
  DROP TABLE "page_whyq_pages_highlight_logos" CASCADE;
  DROP TABLE "page_whyq_pages_ticket_keys" CASCADE;
  DROP TABLE "page_whyq_pages_ticket_side" CASCADE;
  DROP TABLE "page_whyq_pages_ticket_includes" CASCADE;
  DROP TABLE "page_whyq_pages_ticket_partner_panel_perks" CASCADE;
  DROP TABLE "page_whyq_pages_faq_items" CASCADE;
  DROP TABLE "page_whyq_pages" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_stats" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_activities_items" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_highlight_cards" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_highlight_moments" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_highlight_logos" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_ticket_keys" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_ticket_side" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_ticket_includes" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_ticket_partner_panel_perks" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages_faq_items" CASCADE;
  DROP TABLE "_page_whyq_v_version_pages" CASCADE;
  ALTER TABLE "page_whyq" DROP COLUMN "event_line";
  ALTER TABLE "_page_whyq_v" DROP COLUMN "version_event_line";
  DROP TYPE "public"."enum_page_whyq_pages_activities_items_kind";
  DROP TYPE "public"."enum_page_whyq_pages_ticket_keys";
  DROP TYPE "public"."enum_page_whyq_pages_audience";
  DROP TYPE "public"."enum_page_whyq_pages_highlight_layout";
  DROP TYPE "public"."enum__page_whyq_v_version_pages_activities_items_kind";
  DROP TYPE "public"."enum__page_whyq_v_version_pages_ticket_keys";
  DROP TYPE "public"."enum__page_whyq_v_version_pages_audience";
  DROP TYPE "public"."enum__page_whyq_v_version_pages_highlight_layout";`)
}
