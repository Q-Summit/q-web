import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "page_partner_cta_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "page_partner_audiences_startup_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_partner_audiences_startup_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"email" varchar,
  	"photo_id" integer
  );
  
  CREATE TABLE "page_partner_audiences_corporate_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_partner_audiences_corporate_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"email" varchar,
  	"photo_id" integer
  );
  
  CREATE TABLE "page_partner_audiences_investor_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_partner_audiences_investor_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"email" varchar,
  	"photo_id" integer
  );
  
  CREATE TABLE "_page_partner_v_version_cta_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_partner_v_version_audiences_startup_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_partner_v_version_audiences_startup_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"email" varchar,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_partner_v_version_audiences_corporate_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_partner_v_version_audiences_corporate_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"email" varchar,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_partner_v_version_audiences_investor_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_partner_v_version_audiences_investor_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"email" varchar,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  ALTER TABLE "partners" ADD COLUMN "logo_on_dark_id" integer;
  ALTER TABLE "partners" ADD COLUMN "description" varchar;
  ALTER TABLE "_partners_v" ADD COLUMN "version_logo_on_dark_id" integer;
  ALTER TABLE "_partners_v" ADD COLUMN "version_description" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "projector_eyebrow" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "projector_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "projector_intro" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "projector_hint" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "projector_tier_suffix" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "projector_website_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "quotes_hint" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "cta_contact_name" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "cta_contact_role" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "cta_contact_email" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "cta_contact_copy_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "cta_contact_copied_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "cta_contact_photo_id" integer;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_startup_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_startup_summary" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_startup_link_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_startup_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_startup_intro" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_startup_benefits_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_startup_contacts_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_startup_contact_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_corporate_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_corporate_summary" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_corporate_link_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_corporate_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_corporate_intro" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_corporate_benefits_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_corporate_contacts_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_corporate_contact_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_investor_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_investor_summary" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_investor_link_label" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_investor_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_investor_intro" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_investor_benefits_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_investor_contacts_heading" varchar;
  ALTER TABLE "page_partner" ADD COLUMN "audiences_investor_contact_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_projector_eyebrow" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_projector_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_projector_intro" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_projector_hint" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_projector_tier_suffix" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_projector_website_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_quotes_hint" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_cta_contact_name" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_cta_contact_role" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_cta_contact_email" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_cta_contact_copy_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_cta_contact_copied_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_cta_contact_photo_id" integer;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_startup_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_startup_summary" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_startup_link_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_startup_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_startup_intro" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_startup_benefits_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_startup_contacts_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_startup_contact_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_corporate_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_corporate_summary" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_corporate_link_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_corporate_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_corporate_intro" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_corporate_benefits_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_corporate_contacts_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_corporate_contact_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_investor_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_investor_summary" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_investor_link_label" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_investor_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_investor_intro" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_investor_benefits_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_investor_contacts_heading" varchar;
  ALTER TABLE "_page_partner_v" ADD COLUMN "version_audiences_investor_contact_label" varchar;
  ALTER TABLE "page_partner_cta_points" ADD CONSTRAINT "page_partner_cta_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_partner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_startup_benefits" ADD CONSTRAINT "page_partner_audiences_startup_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_partner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_startup_contacts" ADD CONSTRAINT "page_partner_audiences_startup_contacts_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_startup_contacts" ADD CONSTRAINT "page_partner_audiences_startup_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_partner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_corporate_benefits" ADD CONSTRAINT "page_partner_audiences_corporate_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_partner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_corporate_contacts" ADD CONSTRAINT "page_partner_audiences_corporate_contacts_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_corporate_contacts" ADD CONSTRAINT "page_partner_audiences_corporate_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_partner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_investor_benefits" ADD CONSTRAINT "page_partner_audiences_investor_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_partner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_investor_contacts" ADD CONSTRAINT "page_partner_audiences_investor_contacts_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_partner_audiences_investor_contacts" ADD CONSTRAINT "page_partner_audiences_investor_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_partner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_cta_points" ADD CONSTRAINT "_page_partner_v_version_cta_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_partner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_startup_benefits" ADD CONSTRAINT "_page_partner_v_version_audiences_startup_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_partner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_startup_contacts" ADD CONSTRAINT "_page_partner_v_version_audiences_startup_contacts_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_startup_contacts" ADD CONSTRAINT "_page_partner_v_version_audiences_startup_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_partner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_corporate_benefits" ADD CONSTRAINT "_page_partner_v_version_audiences_corporate_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_partner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_corporate_contacts" ADD CONSTRAINT "_page_partner_v_version_audiences_corporate_contacts_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_corporate_contacts" ADD CONSTRAINT "_page_partner_v_version_audiences_corporate_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_partner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_investor_benefits" ADD CONSTRAINT "_page_partner_v_version_audiences_investor_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_partner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_investor_contacts" ADD CONSTRAINT "_page_partner_v_version_audiences_investor_contacts_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_partner_v_version_audiences_investor_contacts" ADD CONSTRAINT "_page_partner_v_version_audiences_investor_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_partner_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_partner_cta_points_order_idx" ON "page_partner_cta_points" USING btree ("_order");
  CREATE INDEX "page_partner_cta_points_parent_id_idx" ON "page_partner_cta_points" USING btree ("_parent_id");
  CREATE INDEX "page_partner_audiences_startup_benefits_order_idx" ON "page_partner_audiences_startup_benefits" USING btree ("_order");
  CREATE INDEX "page_partner_audiences_startup_benefits_parent_id_idx" ON "page_partner_audiences_startup_benefits" USING btree ("_parent_id");
  CREATE INDEX "page_partner_audiences_startup_contacts_order_idx" ON "page_partner_audiences_startup_contacts" USING btree ("_order");
  CREATE INDEX "page_partner_audiences_startup_contacts_parent_id_idx" ON "page_partner_audiences_startup_contacts" USING btree ("_parent_id");
  CREATE INDEX "page_partner_audiences_startup_contacts_photo_idx" ON "page_partner_audiences_startup_contacts" USING btree ("photo_id");
  CREATE INDEX "page_partner_audiences_corporate_benefits_order_idx" ON "page_partner_audiences_corporate_benefits" USING btree ("_order");
  CREATE INDEX "page_partner_audiences_corporate_benefits_parent_id_idx" ON "page_partner_audiences_corporate_benefits" USING btree ("_parent_id");
  CREATE INDEX "page_partner_audiences_corporate_contacts_order_idx" ON "page_partner_audiences_corporate_contacts" USING btree ("_order");
  CREATE INDEX "page_partner_audiences_corporate_contacts_parent_id_idx" ON "page_partner_audiences_corporate_contacts" USING btree ("_parent_id");
  CREATE INDEX "page_partner_audiences_corporate_contacts_photo_idx" ON "page_partner_audiences_corporate_contacts" USING btree ("photo_id");
  CREATE INDEX "page_partner_audiences_investor_benefits_order_idx" ON "page_partner_audiences_investor_benefits" USING btree ("_order");
  CREATE INDEX "page_partner_audiences_investor_benefits_parent_id_idx" ON "page_partner_audiences_investor_benefits" USING btree ("_parent_id");
  CREATE INDEX "page_partner_audiences_investor_contacts_order_idx" ON "page_partner_audiences_investor_contacts" USING btree ("_order");
  CREATE INDEX "page_partner_audiences_investor_contacts_parent_id_idx" ON "page_partner_audiences_investor_contacts" USING btree ("_parent_id");
  CREATE INDEX "page_partner_audiences_investor_contacts_photo_idx" ON "page_partner_audiences_investor_contacts" USING btree ("photo_id");
  CREATE INDEX "_page_partner_v_version_cta_points_order_idx" ON "_page_partner_v_version_cta_points" USING btree ("_order");
  CREATE INDEX "_page_partner_v_version_cta_points_parent_id_idx" ON "_page_partner_v_version_cta_points" USING btree ("_parent_id");
  CREATE INDEX "_page_partner_v_version_audiences_startup_benefits_order_idx" ON "_page_partner_v_version_audiences_startup_benefits" USING btree ("_order");
  CREATE INDEX "_page_partner_v_version_audiences_startup_benefits_parent_id_idx" ON "_page_partner_v_version_audiences_startup_benefits" USING btree ("_parent_id");
  CREATE INDEX "_page_partner_v_version_audiences_startup_contacts_order_idx" ON "_page_partner_v_version_audiences_startup_contacts" USING btree ("_order");
  CREATE INDEX "_page_partner_v_version_audiences_startup_contacts_parent_id_idx" ON "_page_partner_v_version_audiences_startup_contacts" USING btree ("_parent_id");
  CREATE INDEX "_page_partner_v_version_audiences_startup_contacts_photo_idx" ON "_page_partner_v_version_audiences_startup_contacts" USING btree ("photo_id");
  CREATE INDEX "_page_partner_v_version_audiences_corporate_benefits_order_idx" ON "_page_partner_v_version_audiences_corporate_benefits" USING btree ("_order");
  CREATE INDEX "_page_partner_v_version_audiences_corporate_benefits_parent_id_idx" ON "_page_partner_v_version_audiences_corporate_benefits" USING btree ("_parent_id");
  CREATE INDEX "_page_partner_v_version_audiences_corporate_contacts_order_idx" ON "_page_partner_v_version_audiences_corporate_contacts" USING btree ("_order");
  CREATE INDEX "_page_partner_v_version_audiences_corporate_contacts_parent_id_idx" ON "_page_partner_v_version_audiences_corporate_contacts" USING btree ("_parent_id");
  CREATE INDEX "_page_partner_v_version_audiences_corporate_contacts_pho_idx" ON "_page_partner_v_version_audiences_corporate_contacts" USING btree ("photo_id");
  CREATE INDEX "_page_partner_v_version_audiences_investor_benefits_order_idx" ON "_page_partner_v_version_audiences_investor_benefits" USING btree ("_order");
  CREATE INDEX "_page_partner_v_version_audiences_investor_benefits_parent_id_idx" ON "_page_partner_v_version_audiences_investor_benefits" USING btree ("_parent_id");
  CREATE INDEX "_page_partner_v_version_audiences_investor_contacts_order_idx" ON "_page_partner_v_version_audiences_investor_contacts" USING btree ("_order");
  CREATE INDEX "_page_partner_v_version_audiences_investor_contacts_parent_id_idx" ON "_page_partner_v_version_audiences_investor_contacts" USING btree ("_parent_id");
  CREATE INDEX "_page_partner_v_version_audiences_investor_contacts_phot_idx" ON "_page_partner_v_version_audiences_investor_contacts" USING btree ("photo_id");
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_on_dark_id_media_id_fk" FOREIGN KEY ("logo_on_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_version_logo_on_dark_id_media_id_fk" FOREIGN KEY ("version_logo_on_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_partner" ADD CONSTRAINT "page_partner_cta_contact_photo_id_media_id_fk" FOREIGN KEY ("cta_contact_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_partner_v" ADD CONSTRAINT "_page_partner_v_version_cta_contact_photo_id_media_id_fk" FOREIGN KEY ("version_cta_contact_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "partners_logo_on_dark_idx" ON "partners" USING btree ("logo_on_dark_id");
  CREATE INDEX "_partners_v_version_version_logo_on_dark_idx" ON "_partners_v" USING btree ("version_logo_on_dark_id");
  CREATE INDEX "page_partner_cta_contact_cta_contact_photo_idx" ON "page_partner" USING btree ("cta_contact_photo_id");
  CREATE INDEX "_page_partner_v_version_cta_contact_version_cta_contact__idx" ON "_page_partner_v" USING btree ("version_cta_contact_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_partner_cta_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_partner_audiences_startup_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_partner_audiences_startup_contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_partner_audiences_corporate_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_partner_audiences_corporate_contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_partner_audiences_investor_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_partner_audiences_investor_contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_partner_v_version_cta_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_partner_v_version_audiences_startup_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_partner_v_version_audiences_startup_contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_partner_v_version_audiences_corporate_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_partner_v_version_audiences_corporate_contacts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_partner_v_version_audiences_investor_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_page_partner_v_version_audiences_investor_contacts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "page_partner_cta_points" CASCADE;
  DROP TABLE "page_partner_audiences_startup_benefits" CASCADE;
  DROP TABLE "page_partner_audiences_startup_contacts" CASCADE;
  DROP TABLE "page_partner_audiences_corporate_benefits" CASCADE;
  DROP TABLE "page_partner_audiences_corporate_contacts" CASCADE;
  DROP TABLE "page_partner_audiences_investor_benefits" CASCADE;
  DROP TABLE "page_partner_audiences_investor_contacts" CASCADE;
  DROP TABLE "_page_partner_v_version_cta_points" CASCADE;
  DROP TABLE "_page_partner_v_version_audiences_startup_benefits" CASCADE;
  DROP TABLE "_page_partner_v_version_audiences_startup_contacts" CASCADE;
  DROP TABLE "_page_partner_v_version_audiences_corporate_benefits" CASCADE;
  DROP TABLE "_page_partner_v_version_audiences_corporate_contacts" CASCADE;
  DROP TABLE "_page_partner_v_version_audiences_investor_benefits" CASCADE;
  DROP TABLE "_page_partner_v_version_audiences_investor_contacts" CASCADE;
  ALTER TABLE "partners" DROP CONSTRAINT "partners_logo_on_dark_id_media_id_fk";
  
  ALTER TABLE "_partners_v" DROP CONSTRAINT "_partners_v_version_logo_on_dark_id_media_id_fk";
  
  ALTER TABLE "page_partner" DROP CONSTRAINT "page_partner_cta_contact_photo_id_media_id_fk";
  
  ALTER TABLE "_page_partner_v" DROP CONSTRAINT "_page_partner_v_version_cta_contact_photo_id_media_id_fk";
  
  DROP INDEX "partners_logo_on_dark_idx";
  DROP INDEX "_partners_v_version_version_logo_on_dark_idx";
  DROP INDEX "page_partner_cta_contact_cta_contact_photo_idx";
  DROP INDEX "_page_partner_v_version_cta_contact_version_cta_contact__idx";
  ALTER TABLE "partners" DROP COLUMN "logo_on_dark_id";
  ALTER TABLE "partners" DROP COLUMN "description";
  ALTER TABLE "_partners_v" DROP COLUMN "version_logo_on_dark_id";
  ALTER TABLE "_partners_v" DROP COLUMN "version_description";
  ALTER TABLE "page_partner" DROP COLUMN "projector_eyebrow";
  ALTER TABLE "page_partner" DROP COLUMN "projector_heading";
  ALTER TABLE "page_partner" DROP COLUMN "projector_intro";
  ALTER TABLE "page_partner" DROP COLUMN "projector_hint";
  ALTER TABLE "page_partner" DROP COLUMN "projector_tier_suffix";
  ALTER TABLE "page_partner" DROP COLUMN "projector_website_label";
  ALTER TABLE "page_partner" DROP COLUMN "quotes_hint";
  ALTER TABLE "page_partner" DROP COLUMN "cta_contact_name";
  ALTER TABLE "page_partner" DROP COLUMN "cta_contact_role";
  ALTER TABLE "page_partner" DROP COLUMN "cta_contact_email";
  ALTER TABLE "page_partner" DROP COLUMN "cta_contact_copy_label";
  ALTER TABLE "page_partner" DROP COLUMN "cta_contact_copied_label";
  ALTER TABLE "page_partner" DROP COLUMN "cta_contact_photo_id";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_startup_label";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_startup_summary";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_startup_link_label";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_startup_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_startup_intro";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_startup_benefits_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_startup_contacts_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_startup_contact_label";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_corporate_label";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_corporate_summary";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_corporate_link_label";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_corporate_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_corporate_intro";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_corporate_benefits_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_corporate_contacts_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_corporate_contact_label";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_investor_label";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_investor_summary";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_investor_link_label";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_investor_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_investor_intro";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_investor_benefits_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_investor_contacts_heading";
  ALTER TABLE "page_partner" DROP COLUMN "audiences_investor_contact_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_projector_eyebrow";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_projector_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_projector_intro";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_projector_hint";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_projector_tier_suffix";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_projector_website_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_quotes_hint";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_cta_contact_name";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_cta_contact_role";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_cta_contact_email";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_cta_contact_copy_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_cta_contact_copied_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_cta_contact_photo_id";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_startup_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_startup_summary";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_startup_link_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_startup_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_startup_intro";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_startup_benefits_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_startup_contacts_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_startup_contact_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_corporate_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_corporate_summary";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_corporate_link_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_corporate_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_corporate_intro";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_corporate_benefits_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_corporate_contacts_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_corporate_contact_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_investor_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_investor_summary";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_investor_link_label";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_investor_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_investor_intro";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_investor_benefits_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_investor_contacts_heading";
  ALTER TABLE "_page_partner_v" DROP COLUMN "version_audiences_investor_contact_label";`)
}
