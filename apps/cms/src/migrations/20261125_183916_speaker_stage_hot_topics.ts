import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_hot_topics_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__hot_topics_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "hot_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar,
  	"title" varchar,
  	"field" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"thumb_id" integer,
  	"order" numeric,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_hot_topics_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_hot_topics_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_keyword" varchar,
  	"version_title" varchar,
  	"version_field" varchar,
  	"version_description" varchar,
  	"version_image_id" integer,
  	"version_thumb_id" integer,
  	"version_order" numeric,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__hot_topics_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "speakers" ADD COLUMN "talk_title" varchar;
  ALTER TABLE "speakers" ADD COLUMN "quote" varchar;
  ALTER TABLE "_speakers_v" ADD COLUMN "version_talk_title" varchar;
  ALTER TABLE "_speakers_v" ADD COLUMN "version_quote" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hot_topics_id" integer;
  ALTER TABLE "hot_topics" ADD CONSTRAINT "hot_topics_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hot_topics" ADD CONSTRAINT "hot_topics_thumb_id_media_id_fk" FOREIGN KEY ("thumb_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hot_topics_v" ADD CONSTRAINT "_hot_topics_v_parent_id_hot_topics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hot_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hot_topics_v" ADD CONSTRAINT "_hot_topics_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hot_topics_v" ADD CONSTRAINT "_hot_topics_v_version_thumb_id_media_id_fk" FOREIGN KEY ("version_thumb_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "hot_topics_keyword_idx" ON "hot_topics" USING btree ("keyword");
  CREATE INDEX "hot_topics_image_idx" ON "hot_topics" USING btree ("image_id");
  CREATE INDEX "hot_topics_thumb_idx" ON "hot_topics" USING btree ("thumb_id");
  CREATE INDEX "hot_topics_updated_at_idx" ON "hot_topics" USING btree ("updated_at");
  CREATE INDEX "hot_topics_created_at_idx" ON "hot_topics" USING btree ("created_at");
  CREATE INDEX "hot_topics__status_idx" ON "hot_topics" USING btree ("_status");
  CREATE INDEX "_hot_topics_v_parent_idx" ON "_hot_topics_v" USING btree ("parent_id");
  CREATE INDEX "_hot_topics_v_version_version_keyword_idx" ON "_hot_topics_v" USING btree ("version_keyword");
  CREATE INDEX "_hot_topics_v_version_version_image_idx" ON "_hot_topics_v" USING btree ("version_image_id");
  CREATE INDEX "_hot_topics_v_version_version_thumb_idx" ON "_hot_topics_v" USING btree ("version_thumb_id");
  CREATE INDEX "_hot_topics_v_version_version_updated_at_idx" ON "_hot_topics_v" USING btree ("version_updated_at");
  CREATE INDEX "_hot_topics_v_version_version_created_at_idx" ON "_hot_topics_v" USING btree ("version_created_at");
  CREATE INDEX "_hot_topics_v_version_version__status_idx" ON "_hot_topics_v" USING btree ("version__status");
  CREATE INDEX "_hot_topics_v_created_at_idx" ON "_hot_topics_v" USING btree ("created_at");
  CREATE INDEX "_hot_topics_v_updated_at_idx" ON "_hot_topics_v" USING btree ("updated_at");
  CREATE INDEX "_hot_topics_v_latest_idx" ON "_hot_topics_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hot_topics_fk" FOREIGN KEY ("hot_topics_id") REFERENCES "public"."hot_topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_hot_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("hot_topics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hot_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_hot_topics_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hot_topics" CASCADE;
  DROP TABLE "_hot_topics_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hot_topics_fk";
  
  DROP INDEX "payload_locked_documents_rels_hot_topics_id_idx";
  ALTER TABLE "speakers" DROP COLUMN "talk_title";
  ALTER TABLE "speakers" DROP COLUMN "quote";
  ALTER TABLE "_speakers_v" DROP COLUMN "version_talk_title";
  ALTER TABLE "_speakers_v" DROP COLUMN "version_quote";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hot_topics_id";
  DROP TYPE "public"."enum_hot_topics_status";
  DROP TYPE "public"."enum__hot_topics_v_version_status";`)
}
