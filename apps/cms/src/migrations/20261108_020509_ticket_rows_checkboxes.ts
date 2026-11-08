import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_tickets_included_groups_rows_tickets" CASCADE;
  DROP TABLE "_page_tickets_v_version_included_groups_rows_tickets" CASCADE;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN "student" boolean DEFAULT false;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN "young_professional" boolean DEFAULT false;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN "start_up" boolean DEFAULT false;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN "investor" boolean DEFAULT false;
  ALTER TABLE "page_tickets_included_groups_rows" ADD COLUMN "corporate" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN "student" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN "young_professional" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN "start_up" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN "investor" boolean DEFAULT false;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" ADD COLUMN "corporate" boolean DEFAULT false;
  DROP TYPE "public"."enum_page_tickets_included_groups_rows_tickets";
  DROP TYPE "public"."enum__page_tickets_v_version_included_groups_rows_tickets";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_tickets_included_groups_rows_tickets" AS ENUM('student', 'young-professional', 'start-up', 'investor', 'corporate');
  CREATE TYPE "public"."enum__page_tickets_v_version_included_groups_rows_tickets" AS ENUM('student', 'young-professional', 'start-up', 'investor', 'corporate');
  CREATE TABLE "page_tickets_included_groups_rows_tickets" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_page_tickets_included_groups_rows_tickets",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_page_tickets_v_version_included_groups_rows_tickets" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__page_tickets_v_version_included_groups_rows_tickets",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "page_tickets_included_groups_rows_tickets" ADD CONSTRAINT "page_tickets_included_groups_rows_tickets_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."page_tickets_included_groups_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_included_groups_rows_tickets" ADD CONSTRAINT "_page_tickets_v_version_included_groups_rows_tickets_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_page_tickets_v_version_included_groups_rows"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_tickets_included_groups_rows_tickets_order_idx" ON "page_tickets_included_groups_rows_tickets" USING btree ("order");
  CREATE INDEX "page_tickets_included_groups_rows_tickets_parent_idx" ON "page_tickets_included_groups_rows_tickets" USING btree ("parent_id");
  CREATE INDEX "_page_tickets_v_version_included_groups_rows_tickets_order_idx" ON "_page_tickets_v_version_included_groups_rows_tickets" USING btree ("order");
  CREATE INDEX "_page_tickets_v_version_included_groups_rows_tickets_parent_idx" ON "_page_tickets_v_version_included_groups_rows_tickets" USING btree ("parent_id");
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN "student";
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN "young_professional";
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN "start_up";
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN "investor";
  ALTER TABLE "page_tickets_included_groups_rows" DROP COLUMN "corporate";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN "student";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN "young_professional";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN "start_up";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN "investor";
  ALTER TABLE "_page_tickets_v_version_included_groups_rows" DROP COLUMN "corporate";`)
}
