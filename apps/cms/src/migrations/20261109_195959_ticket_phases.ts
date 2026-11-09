import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "page_tickets_phases_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"label" varchar,
  	"discount" numeric
  );
  
  CREATE TABLE "_page_tickets_v_version_phases_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"label" varchar,
  	"discount" numeric,
  	"_uuid" varchar
  );
  
  ALTER TABLE "page_tickets" ADD COLUMN "phases_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "phases_active_key" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "phases_current_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "phases_upcoming_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "phases_past_label" varchar;
  ALTER TABLE "page_tickets" ADD COLUMN "phases_discount_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_phases_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_phases_active_key" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_phases_current_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_phases_upcoming_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_phases_past_label" varchar;
  ALTER TABLE "_page_tickets_v" ADD COLUMN "version_phases_discount_label" varchar;
  ALTER TABLE "page_tickets_phases_items" ADD CONSTRAINT "page_tickets_phases_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_phases_items" ADD CONSTRAINT "_page_tickets_v_version_phases_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_tickets_phases_items_order_idx" ON "page_tickets_phases_items" USING btree ("_order");
  CREATE INDEX "page_tickets_phases_items_parent_id_idx" ON "page_tickets_phases_items" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_phases_items_order_idx" ON "_page_tickets_v_version_phases_items" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_phases_items_parent_id_idx" ON "_page_tickets_v_version_phases_items" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_tickets_phases_items" CASCADE;
  DROP TABLE "_page_tickets_v_version_phases_items" CASCADE;
  ALTER TABLE "page_tickets" DROP COLUMN "phases_label";
  ALTER TABLE "page_tickets" DROP COLUMN "phases_active_key";
  ALTER TABLE "page_tickets" DROP COLUMN "phases_current_label";
  ALTER TABLE "page_tickets" DROP COLUMN "phases_upcoming_label";
  ALTER TABLE "page_tickets" DROP COLUMN "phases_past_label";
  ALTER TABLE "page_tickets" DROP COLUMN "phases_discount_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_phases_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_phases_active_key";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_phases_current_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_phases_upcoming_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_phases_past_label";
  ALTER TABLE "_page_tickets_v" DROP COLUMN "version_phases_discount_label";`)
}
