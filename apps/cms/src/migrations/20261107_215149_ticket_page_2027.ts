import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_tickets_offer_tickets_key" AS ENUM('student', 'young-professional', 'start-up', 'investor', 'corporate');
  CREATE TYPE "public"."enum_page_tickets_included_groups_rows_tickets" AS ENUM('student', 'young-professional', 'start-up', 'investor', 'corporate');
  CREATE TYPE "public"."enum_page_tickets_included_groups_kind" AS ENUM('benefit', 'eligibility');
  CREATE TYPE "public"."enum__page_tickets_v_version_offer_tickets_key" AS ENUM('student', 'young-professional', 'start-up', 'investor', 'corporate');
  CREATE TYPE "public"."enum__page_tickets_v_version_included_groups_rows_tickets" AS ENUM('student', 'young-professional', 'start-up', 'investor', 'corporate');
  CREATE TYPE "public"."enum__page_tickets_v_version_included_groups_kind" AS ENUM('benefit', 'eligibility');
  CREATE TABLE "page_tickets_offer_tickets_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_tickets_offer_tickets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_page_tickets_offer_tickets_key",
  	"name" varchar,
  	"description" varchar,
  	"regular_price" numeric,
  	"price" numeric,
  	"note" varchar
  );
  
  CREATE TABLE "page_tickets_included_groups_rows_tickets" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_page_tickets_included_groups_rows_tickets",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "page_tickets_included_groups_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "page_tickets_included_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"kind" "enum_page_tickets_included_groups_kind" DEFAULT 'benefit'
  );
  
  CREATE TABLE "_page_tickets_v_version_offer_tickets_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_offer_tickets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" "enum__page_tickets_v_version_offer_tickets_key",
  	"name" varchar,
  	"description" varchar,
  	"regular_price" numeric,
  	"price" numeric,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_included_groups_rows_tickets" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__page_tickets_v_version_included_groups_rows_tickets",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_page_tickets_v_version_included_groups_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_included_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"kind" "enum__page_tickets_v_version_included_groups_kind" DEFAULT 'benefit',
  	"_uuid" varchar
  );
  
  ALTER TABLE "page_tickets" ADD COLUMN "hero_eyebrow" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "hero_heading" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "hero_intro" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "hero_compare_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "offer_purchase_href" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "offer_buy_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "offer_details_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "offer_save_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "offer_footnote" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "included_heading" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "included_intro" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "included_ticket_buy_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "included_count_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "included_included_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "included_not_included_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "included_required_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "included_not_required_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "compare_heading" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "compare_intro" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "compare_first_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "compare_second_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_hero_eyebrow" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_hero_heading" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_hero_intro" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_hero_compare_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_offer_purchase_href" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_offer_buy_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_offer_details_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_offer_save_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_offer_footnote" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_included_heading" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_included_intro" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_included_ticket_buy_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_included_count_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_included_included_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_included_not_included_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_included_required_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_included_not_required_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_compare_heading" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_compare_intro" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_compare_first_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_compare_second_label" varchar;
  ALTER TABLE "page_tickets_offer_tickets_highlights" ADD CONSTRAINT "page_tickets_offer_tickets_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets_offer_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_offer_tickets" ADD CONSTRAINT "page_tickets_offer_tickets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_included_groups_rows_tickets" ADD CONSTRAINT "page_tickets_included_groups_rows_tickets_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."page_tickets_included_groups_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_included_groups_rows" ADD CONSTRAINT "page_tickets_included_groups_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets_included_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_included_groups" ADD CONSTRAINT "page_tickets_included_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_offer_tickets_highlights" ADD CONSTRAINT "_page_tickets_v_version_offer_tickets_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v_version_offer_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_offer_tickets" ADD CONSTRAINT "_page_tickets_v_version_offer_tickets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows_tickets" ADD CONSTRAINT "_page_tickets_v_version_included_groups_rows_tickets_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_page_tickets_v_version_included_groups_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD CONSTRAINT "_page_tickets_v_version_included_groups_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v_version_included_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_included_groups" ADD CONSTRAINT "_page_tickets_v_version_included_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_tickets_offer_tickets_highlights_order_idx" ON "page_tickets_offer_tickets_highlights" USING btree ("_order");
  CREATE INDEX "page_tickets_offer_tickets_highlights_parent_id_idx" ON "page_tickets_offer_tickets_highlights" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_offer_tickets_order_idx" ON "page_tickets_offer_tickets" USING btree ("_order");
  CREATE INDEX "page_tickets_offer_tickets_parent_id_idx" ON "page_tickets_offer_tickets" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_included_groups_rows_tickets_order_idx" ON "page_tickets_included_groups_rows_tickets" USING btree ("order");
  CREATE INDEX "page_tickets_included_groups_rows_tickets_parent_idx" ON "page_tickets_included_groups_rows_tickets" USING btree ("parent_id");
  CREATE INDEX "page_tickets_included_groups_rows_order_idx" ON "page_tickets_included_groups_rows" USING btree ("_order");
  CREATE INDEX "page_tickets_included_groups_rows_parent_id_idx" ON "page_tickets_included_groups_rows" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_included_groups_order_idx" ON "page_tickets_included_groups" USING btree ("_order");
  CREATE INDEX "page_tickets_included_groups_parent_id_idx" ON "page_tickets_included_groups" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_offer_tickets_highlights_order_idx" ON "_page_tickets_v_version_offer_tickets_highlights" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_offer_tickets_highlights_parent_id_idx" ON "_page_tickets_v_version_offer_tickets_highlights" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_offer_tickets_order_idx" ON "_page_tickets_v_version_offer_tickets" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_offer_tickets_parent_id_idx" ON "_page_tickets_v_version_offer_tickets" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_included_groups_rows_tickets_order_idx" ON "_page_tickets_v_version_included_groups_rows_tickets" USING btree ("order");
  CREATE INDEX "_page_tickets_v_version_included_groups_rows_tickets_parent_idx" ON "_page_tickets_v_version_included_groups_rows_tickets" USING btree ("parent_id");
  CREATE INDEX "_page_tickets_v_version_included_groups_rows_order_idx" ON "_page_tickets_v_version_included_groups_rows" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_included_groups_rows_parent_id_idx" ON "_page_tickets_v_version_included_groups_rows" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_included_groups_order_idx" ON "_page_tickets_v_version_included_groups" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_included_groups_parent_id_idx" ON "_page_tickets_v_version_included_groups" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_tickets_offer_tickets_highlights" CASCADE;
  DROP TABLE "page_tickets_offer_tickets" CASCADE;
  DROP TABLE "page_tickets_included_groups_rows_tickets" CASCADE;
  DROP TABLE "page_tickets_included_groups_rows" CASCADE;
  DROP TABLE "page_tickets_included_groups" CASCADE;
  DROP TABLE "_page_tickets_v_version_offer_tickets_highlights" CASCADE;
  DROP TABLE "_page_tickets_v_version_offer_tickets" CASCADE;
  DROP TABLE "_page_tickets_v_version_included_groups_rows_tickets" CASCADE;
  DROP TABLE "_page_tickets_v_version_included_groups_rows" CASCADE;
  DROP TABLE "_page_tickets_v_version_included_groups" CASCADE;
  ALTER TABLE "page_tickets" DROP COLUMN "hero_eyebrow";
  ALTER TABLE "page_tickets" DROP COLUMN "hero_heading";
  ALTER TABLE "page_tickets" DROP COLUMN "hero_intro";
  ALTER TABLE "page_tickets" DROP COLUMN "hero_compare_label";
  ALTER TABLE "page_tickets" DROP COLUMN "offer_purchase_href";
  ALTER TABLE "page_tickets" DROP COLUMN "offer_buy_label";
  ALTER TABLE "page_tickets" DROP COLUMN "offer_details_label";
  ALTER TABLE "page_tickets" DROP COLUMN "offer_save_label";
  ALTER TABLE "page_tickets" DROP COLUMN "offer_footnote";
  ALTER TABLE "page_tickets" DROP COLUMN "included_heading";
  ALTER TABLE "page_tickets" DROP COLUMN "included_intro";
  ALTER TABLE "page_tickets" DROP COLUMN "included_ticket_buy_label";
  ALTER TABLE "page_tickets" DROP COLUMN "included_count_label";
  ALTER TABLE "page_tickets" DROP COLUMN "included_included_label";
  ALTER TABLE "page_tickets" DROP COLUMN "included_not_included_label";
  ALTER TABLE "page_tickets" DROP COLUMN "included_required_label";
  ALTER TABLE "page_tickets" DROP COLUMN "included_not_required_label";
  ALTER TABLE "page_tickets" DROP COLUMN "compare_heading";
  ALTER TABLE "page_tickets" DROP COLUMN "compare_intro";
  ALTER TABLE "page_tickets" DROP COLUMN "compare_first_label";
  ALTER TABLE "page_tickets" DROP COLUMN "compare_second_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_hero_eyebrow";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_hero_heading";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_hero_intro";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_hero_compare_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_offer_purchase_href";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_offer_buy_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_offer_details_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_offer_save_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_offer_footnote";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_included_heading";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_included_intro";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_included_ticket_buy_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_included_count_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_included_included_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_included_not_included_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_included_required_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_included_not_required_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_compare_heading";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_compare_intro";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_compare_first_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_compare_second_label";
  DROP TYPE "public"."enum_page_tickets_offer_tickets_key";
  DROP TYPE "public"."enum_page_tickets_included_groups_rows_tickets";
  DROP TYPE "public"."enum_page_tickets_included_groups_kind";
  DROP TYPE "public"."enum__page_tickets_v_version_offer_tickets_key";
  DROP TYPE "public"."enum__page_tickets_v_version_included_groups_rows_tickets";
  DROP TYPE "public"."enum__page_tickets_v_version_included_groups_kind";`)
}
