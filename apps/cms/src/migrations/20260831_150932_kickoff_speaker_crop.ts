import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_kickoff_socials_links" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum_page_kickoff_socials_links_icon";
  CREATE TYPE "public"."enum_page_kickoff_socials_links_icon" AS ENUM('whatsapp', 'tiktok', 'instagram', 'linkedin');
  ALTER TABLE "page_kickoff_socials_links" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_page_kickoff_socials_links_icon" USING "icon"::"public"."enum_page_kickoff_socials_links_icon";
  ALTER TABLE "_page_kickoff_v_version_socials_links" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum__page_kickoff_v_version_socials_links_icon";
  CREATE TYPE "public"."enum__page_kickoff_v_version_socials_links_icon" AS ENUM('whatsapp', 'tiktok', 'instagram', 'linkedin');
  ALTER TABLE "_page_kickoff_v_version_socials_links" ALTER COLUMN "icon" SET DATA TYPE "public"."enum__page_kickoff_v_version_socials_links_icon" USING "icon"::"public"."enum__page_kickoff_v_version_socials_links_icon";
  ALTER TABLE "page_kickoff_kickoff_speakers" ADD COLUMN "crop_x" numeric DEFAULT 50;
  ALTER TABLE "page_kickoff_kickoff_speakers" ADD COLUMN "crop_y" numeric DEFAULT 24;
  ALTER TABLE "page_kickoff_kickoff_speakers" ADD COLUMN "crop_zoom" numeric DEFAULT 100;
  ALTER TABLE "page_kickoff_kickoff_speakers" ADD COLUMN "crop_shift_y" numeric DEFAULT 0;
  ALTER TABLE "page_kickoff" ADD COLUMN "kickoff_ui_register_label" varchar;
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" ADD COLUMN "crop_x" numeric DEFAULT 50;
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" ADD COLUMN "crop_y" numeric DEFAULT 24;
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" ADD COLUMN "crop_zoom" numeric DEFAULT 100;
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" ADD COLUMN "crop_shift_y" numeric DEFAULT 0;
  ALTER TABLE "_page_kickoff_v" ADD COLUMN "version_kickoff_ui_register_label" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_kickoff_socials_links" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum_page_kickoff_socials_links_icon";
  CREATE TYPE "public"."enum_page_kickoff_socials_links_icon" AS ENUM('linkedin', 'instagram', 'tiktok', 'whatsapp');
  ALTER TABLE "page_kickoff_socials_links" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_page_kickoff_socials_links_icon" USING "icon"::"public"."enum_page_kickoff_socials_links_icon";
  ALTER TABLE "_page_kickoff_v_version_socials_links" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum__page_kickoff_v_version_socials_links_icon";
  CREATE TYPE "public"."enum__page_kickoff_v_version_socials_links_icon" AS ENUM('linkedin', 'instagram', 'tiktok', 'whatsapp');
  ALTER TABLE "_page_kickoff_v_version_socials_links" ALTER COLUMN "icon" SET DATA TYPE "public"."enum__page_kickoff_v_version_socials_links_icon" USING "icon"::"public"."enum__page_kickoff_v_version_socials_links_icon";
  ALTER TABLE "page_kickoff_kickoff_speakers" DROP COLUMN "crop_x";
  ALTER TABLE "page_kickoff_kickoff_speakers" DROP COLUMN "crop_y";
  ALTER TABLE "page_kickoff_kickoff_speakers" DROP COLUMN "crop_zoom";
  ALTER TABLE "page_kickoff_kickoff_speakers" DROP COLUMN "crop_shift_y";
  ALTER TABLE "page_kickoff" DROP COLUMN "kickoff_ui_register_label";
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" DROP COLUMN "crop_x";
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" DROP COLUMN "crop_y";
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" DROP COLUMN "crop_zoom";
  ALTER TABLE "_page_kickoff_v_version_kickoff_speakers" DROP COLUMN "crop_shift_y";
  ALTER TABLE "_page_kickoff_v" DROP COLUMN "version_kickoff_ui_register_label";`)
}
