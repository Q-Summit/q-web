import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."hackathon_partner_logo_file" ADD VALUE 'digitalocean-logo-horizontal-blue.svg';
  ALTER TYPE "public"."hackathon_partner_logo_file" ADD VALUE 'dev-logo-black.svg';
  ALTER TYPE "public"."hackathon_partner_logo_file" ADD VALUE 'elevenlabs-logo-black.svg';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_hackathon_partners_groups_partners" ALTER COLUMN "logo_file" SET DATA TYPE text;
  ALTER TABLE "_page_hackathon_v_version_partners_groups_partners" ALTER COLUMN "logo_file" SET DATA TYPE text;
  DROP TYPE "public"."hackathon_partner_logo_file";
  CREATE TYPE "public"."hackathon_partner_logo_file" AS ENUM('69bfc230ceecbebceff708fc_new-logo.webp', '69b17a0e089f34c65a5e14a2_Picnic_logo.svg', '69bfc037724d038aa2ba26bc_image.png', '69c25665fc7b9cf5fb7a2889_f6961aac836f-Logo__2_.webp', '69d00444ac69243eaf2b4f4f_istari-logo.svg', '69c255cf7613b98e497cf289_OpenAI-black-wordmark(1).webp', '69b2e8289e0d3b7dd0ae9529_lovable_logo.svg', '69c99a0acf960a512107bc95_Anthropic_logo.svg', '69c256c8d3ff156cf6877066_elevenlabs-logo-black.webp', '69ccf786df18a395b3fee7fd_n8n_pink%2Bblack_logo.svg', '69d40a60aa0c813fdc6344eb_featherlessai-transparent.webp', '69d675fef0b853cb5df97e4e_liveavatar_logo_vertical_dark.webp', '69b458c74be9d2023714bcbf_itmx_logo.webp', '69d00453416ddd4a45dad964_mlh-logo-color-dark.svg');
  ALTER TABLE "page_hackathon_partners_groups_partners" ALTER COLUMN "logo_file" SET DATA TYPE "public"."hackathon_partner_logo_file" USING "logo_file"::"public"."hackathon_partner_logo_file";
  ALTER TABLE "_page_hackathon_v_version_partners_groups_partners" ALTER COLUMN "logo_file" SET DATA TYPE "public"."hackathon_partner_logo_file" USING "logo_file"::"public"."hackathon_partner_logo_file";`)
}
