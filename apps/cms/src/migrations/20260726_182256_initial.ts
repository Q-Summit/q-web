import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_partners_tier" AS ENUM('platinum', 'gold', 'silver', 'starter', 'knowledge', 'event', 'mobility', 'university-and-network', 'media');
  CREATE TYPE "public"."enum_partners_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__partners_v_version_tier" AS ENUM('platinum', 'gold', 'silver', 'starter', 'knowledge', 'event', 'mobility', 'university-and-network', 'media');
  CREATE TYPE "public"."enum__partners_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_jobs_workload" AS ENUM('full-time', 'internship', 'working-student');
  CREATE TYPE "public"."enum_jobs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__jobs_v_version_workload" AS ENUM('full-time', 'internship', 'working-student');
  CREATE TYPE "public"."enum__jobs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_speakers_group" AS ENUM('current', 'moderation', 'panel', 'previous');
  CREATE TYPE "public"."enum_speakers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__speakers_v_version_group" AS ENUM('current', 'moderation', 'panel', 'previous');
  CREATE TYPE "public"."enum__speakers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_team_division" AS ENUM('chair', 'pr', 'partner', 'finance', 'operations', 'concept', 'it');
  CREATE TYPE "public"."enum_team_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__team_v_version_division" AS ENUM('chair', 'pr', 'partner', 'finance', 'operations', 'concept', 'it');
  CREATE TYPE "public"."enum__team_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_past_teams_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__past_teams_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_faqs_page" AS ENUM('home', 'program', 'hackathon');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_version_page" AS ENUM('home', 'program', 'hackathon');
  CREATE TYPE "public"."enum__faqs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_testimonials_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonials_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_users_divisions" AS ENUM('chair', 'pr', 'partner', 'finance', 'operations', 'concept', 'it');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('editor', 'approver', 'admin');
  CREATE TYPE "public"."enum_page_home_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_home_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_whyq_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_whyq_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_speaker_panels_icon_key" AS ENUM('globe', 'refund', 'ai');
  CREATE TYPE "public"."enum_page_speaker_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_speaker_v_version_panels_icon_key" AS ENUM('globe', 'refund', 'ai');
  CREATE TYPE "public"."enum__page_speaker_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_partner_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_partner_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_program_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_program_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."hackathon_partner_logo_file" AS ENUM('69bfc230ceecbebceff708fc_new-logo.webp', '69b17a0e089f34c65a5e14a2_Picnic_logo.svg', '69bfc037724d038aa2ba26bc_image.png', '69c25665fc7b9cf5fb7a2889_f6961aac836f-Logo__2_.webp', '69d00444ac69243eaf2b4f4f_istari-logo.svg', '69c255cf7613b98e497cf289_OpenAI-black-wordmark(1).webp', '69b2e8289e0d3b7dd0ae9529_lovable_logo.svg', '69c99a0acf960a512107bc95_Anthropic_logo.svg', '69c256c8d3ff156cf6877066_elevenlabs-logo-black.webp', '69ccf786df18a395b3fee7fd_n8n_pink%2Bblack_logo.svg', '69d40a60aa0c813fdc6344eb_featherlessai-transparent.webp', '69d675fef0b853cb5df97e4e_liveavatar_logo_vertical_dark.webp', '69b458c74be9d2023714bcbf_itmx_logo.webp', '69d00453416ddd4a45dad964_mlh-logo-color-dark.svg');
  CREATE TYPE "public"."enum_page_hackathon_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_hackathon_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_our_team_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_our_team_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_jobs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_jobs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_tickets_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_tickets_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_contact_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_contact_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_page_past_teams_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__page_past_teams_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_site_settings_footer_social_links_platform" AS ENUM('tiktok', 'instagram-qsummit', 'instagram-qhack', 'linkedin', 'youtube');
  CREATE TYPE "public"."enum_site_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_settings_v_version_footer_social_links_platform" AS ENUM('tiktok', 'instagram-qsummit', 'instagram-qhack', 'linkedin', 'youtube');
  CREATE TYPE "public"."enum__site_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_legal_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"website_url" varchar,
  	"logo_id" integer,
  	"tier" "enum_partners_tier",
  	"order" numeric,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_partners_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_partners_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_website_url" varchar,
  	"version_logo_id" integer,
  	"version_tier" "enum__partners_v_version_tier",
  	"version_order" numeric,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__partners_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"company" varchar,
  	"location" varchar,
  	"workload" "enum_jobs_workload",
  	"description" jsonb,
  	"apply_url" varchar,
  	"logo_id" integer,
  	"slug" varchar,
  	"order" numeric,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_jobs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_jobs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_company" varchar,
  	"version_location" varchar,
  	"version_workload" "enum__jobs_v_version_workload",
  	"version_description" jsonb,
  	"version_apply_url" varchar,
  	"version_logo_id" integer,
  	"version_slug" varchar,
  	"version_order" numeric,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__jobs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "speakers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"role" varchar,
  	"company" varchar,
  	"role_line" varchar,
  	"bio" varchar,
  	"group" "enum_speakers_group" DEFAULT 'current',
  	"year" numeric,
  	"order" numeric,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_speakers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_speakers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_photo_id" integer,
  	"version_role" varchar,
  	"version_company" varchar,
  	"version_role_line" varchar,
  	"version_bio" varchar,
  	"version_group" "enum__speakers_v_version_group" DEFAULT 'current',
  	"version_year" numeric,
  	"version_order" numeric,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__speakers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "team" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"photo_id" integer,
  	"linkedin" varchar,
  	"division" "enum_team_division",
  	"year" varchar,
  	"order" numeric,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_team_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_team_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_role" varchar,
  	"version_photo_id" integer,
  	"version_linkedin" varchar,
  	"version_division" "enum__team_v_version_division",
  	"version_year" varchar,
  	"version_order" numeric,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__team_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "past_teams" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" varchar,
  	"photo_id" integer,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_past_teams_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_past_teams_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_year" varchar,
  	"version_photo_id" integer,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__past_teams_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"page" "enum_faqs_page",
  	"order" numeric,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_faqs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_faqs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_question" varchar,
  	"version_answer" jsonb,
  	"version_page" "enum__faqs_v_version_page",
  	"version_order" numeric,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__faqs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"attribution" varchar,
  	"photo_id" integer,
  	"order" numeric,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_testimonials_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_testimonials_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_quote" varchar,
  	"version_attribution" varchar,
  	"version_photo_id" integer,
  	"version_order" numeric,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__testimonials_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_divisions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_divisions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sub" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"partners_id" integer,
  	"jobs_id" integer,
  	"speakers_id" integer,
  	"team_id" integer,
  	"past_teams_id" integer,
  	"faqs_id" integer,
  	"testimonials_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "page_home_hero_announcement_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_home_stats_items_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_home_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "page_home_partner_band_items_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_home_partner_band_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "page_home_why_attend_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_headline" varchar,
  	"hero_tagline" varchar,
  	"hero_cta_label" varchar,
  	"hero_cta_href" varchar,
  	"event_start_date" timestamp(3) with time zone,
  	"event_end_date" timestamp(3) with time zone,
  	"stats_heading" varchar,
  	"stats_intro" varchar,
  	"partner_band_cta_label" varchar,
  	"partner_band_cta_href" varchar,
  	"previous_speakers_heading" varchar,
  	"previous_speakers_intro" varchar,
  	"previous_speakers_cta_label" varchar,
  	"previous_speakers_cta_href" varchar,
  	"why_attend_heading" varchar,
  	"why_attend_intro" varchar,
  	"why_attend_cta_label" varchar,
  	"why_attend_cta_href" varchar,
  	"faq_section_heading" varchar,
  	"faq_section_intro" varchar,
  	"faq_section_cta_label" varchar,
  	"faq_section_cta_href" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_home_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_home_v_version_hero_announcement_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v_version_stats_items_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v_version_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v_version_partner_band_items_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v_version_partner_band_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v_version_why_attend_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_home_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_headline" varchar,
  	"version_hero_tagline" varchar,
  	"version_hero_cta_label" varchar,
  	"version_hero_cta_href" varchar,
  	"version_event_start_date" timestamp(3) with time zone,
  	"version_event_end_date" timestamp(3) with time zone,
  	"version_stats_heading" varchar,
  	"version_stats_intro" varchar,
  	"version_partner_band_cta_label" varchar,
  	"version_partner_band_cta_href" varchar,
  	"version_previous_speakers_heading" varchar,
  	"version_previous_speakers_intro" varchar,
  	"version_previous_speakers_cta_label" varchar,
  	"version_previous_speakers_cta_href" varchar,
  	"version_why_attend_heading" varchar,
  	"version_why_attend_intro" varchar,
  	"version_why_attend_cta_label" varchar,
  	"version_why_attend_cta_href" varchar,
  	"version_faq_section_heading" varchar,
  	"version_faq_section_intro" varchar,
  	"version_faq_section_cta_label" varchar,
  	"version_faq_section_cta_href" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_home_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_whyq_audiences_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_whyq_audiences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor_id" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"image_file_id" integer,
  	"image_alt" varchar,
  	"image_left" boolean DEFAULT false
  );
  
  CREATE TABLE "page_whyq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_whyq_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_whyq_v_version_audiences_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v_version_audiences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor_id" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"image_file_id" integer,
  	"image_alt" varchar,
  	"image_left" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_whyq_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_heading" varchar,
  	"version_intro" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_whyq_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_speaker_panels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"icon_key" "enum_page_speaker_panels_icon_key"
  );
  
  CREATE TABLE "page_speaker" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_speaker_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_speaker_v_version_panels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"icon_key" "enum__page_speaker_v_version_panels_icon_key",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_speaker_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_heading" varchar,
  	"version_intro" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_speaker_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_partner" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"cta_heading" varchar,
  	"cta_text" varchar,
  	"cta_button_label" varchar,
  	"cta_button_href" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_partner_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_partner_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_heading" varchar,
  	"version_cta_heading" varchar,
  	"version_cta_text" varchar,
  	"version_cta_button_label" varchar,
  	"version_cta_button_href" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_partner_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_program_agenda_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_program" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"agenda_heading" varchar,
  	"agenda_intro" varchar,
  	"faq_section_heading" varchar,
  	"faq_section_intro" varchar,
  	"closing_cta_heading" varchar,
  	"closing_cta_text" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_program_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_program_v_version_agenda_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_program_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_agenda_heading" varchar,
  	"version_agenda_intro" varchar,
  	"version_faq_section_heading" varchar,
  	"version_faq_section_intro" varchar,
  	"version_closing_cta_heading" varchar,
  	"version_closing_cta_text" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_program_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_hackathon_partners_groups_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"href" varchar,
  	"logo_file" "hackathon_partner_logo_file",
  	"note" varchar
  );
  
  CREATE TABLE "page_hackathon_partners_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group" varchar
  );
  
  CREATE TABLE "page_hackathon_benefits_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_hackathon_schedule_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "page_hackathon" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_headline" varchar,
  	"hero_tagline" varchar,
  	"hero_cta_label" varchar,
  	"hero_cta_href" varchar,
  	"partners_heading" varchar,
  	"benefits_heading" varchar,
  	"schedule_heading" varchar,
  	"schedule_intro" varchar,
  	"faq_section_heading" varchar,
  	"faq_section_intro" varchar,
  	"closing_cta_heading" varchar,
  	"closing_cta_text" varchar,
  	"closing_cta_mailto_label" varchar,
  	"closing_cta_mailto_email" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_hackathon_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_hackathon_v_version_partners_groups_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"href" varchar,
  	"logo_file" "hackathon_partner_logo_file",
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_hackathon_v_version_partners_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_hackathon_v_version_benefits_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_hackathon_v_version_schedule_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_hackathon_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_headline" varchar,
  	"version_hero_tagline" varchar,
  	"version_hero_cta_label" varchar,
  	"version_hero_cta_href" varchar,
  	"version_partners_heading" varchar,
  	"version_benefits_heading" varchar,
  	"version_schedule_heading" varchar,
  	"version_schedule_intro" varchar,
  	"version_faq_section_heading" varchar,
  	"version_faq_section_intro" varchar,
  	"version_closing_cta_heading" varchar,
  	"version_closing_cta_text" varchar,
  	"version_closing_cta_mailto_label" varchar,
  	"version_closing_cta_mailto_email" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_hackathon_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_our_team" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_our_team_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_our_team_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_heading" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_our_team_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"detail_how_to_contact_heading" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_jobs_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_jobs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_heading" varchar,
  	"version_intro" varchar,
  	"version_detail_how_to_contact_heading" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_jobs_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_tickets_tiers_items_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_tickets_tiers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" varchar,
  	"note" varchar,
  	"buy_label" varchar,
  	"buy_href" varchar
  );
  
  CREATE TABLE "page_tickets_comparison_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" varchar,
  	"audience" varchar
  );
  
  CREATE TABLE "page_tickets_comparison_groups_rows_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" boolean DEFAULT false
  );
  
  CREATE TABLE "page_tickets_comparison_groups_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"feature" varchar
  );
  
  CREATE TABLE "page_tickets_comparison_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group" varchar
  );
  
  CREATE TABLE "page_tickets_categories_items_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_tickets_categories_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "page_tickets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tiers_heading" varchar,
  	"tiers_intro" varchar,
  	"comparison_heading" varchar,
  	"comparison_intro" varchar,
  	"comparison_academic_note" varchar,
  	"categories_heading" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_tickets_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_tickets_v_version_tiers_items_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_tiers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" varchar,
  	"note" varchar,
  	"buy_label" varchar,
  	"buy_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_comparison_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" varchar,
  	"audience" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_comparison_groups_rows_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_comparison_groups_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"feature" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_comparison_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_categories_items_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v_version_categories_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_tickets_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_tiers_heading" varchar,
  	"version_tiers_intro" varchar,
  	"version_comparison_heading" varchar,
  	"version_comparison_intro" varchar,
  	"version_comparison_academic_note" varchar,
  	"version_categories_heading" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_tickets_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_contact_board_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_contact_board_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"email" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "page_contact_reach_out_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_contact_reach_out_items_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "page_contact_reach_out_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"email" varchar
  );
  
  CREATE TABLE "page_contact" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"board_heading" varchar,
  	"reach_out_heading" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_contact_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_contact_v_version_board_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_contact_v_version_board_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"email" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_contact_v_version_reach_out_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_contact_v_version_reach_out_items_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_contact_v_version_reach_out_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"email" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_page_contact_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_board_heading" varchar,
  	"version_reach_out_heading" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_contact_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "page_past_teams" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"title" varchar,
  	"meta_description" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_page_past_teams_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_page_past_teams_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_heading" varchar,
  	"version_intro" varchar,
  	"version_title" varchar,
  	"version_meta_description" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__page_past_teams_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "site_settings_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "site_settings_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "site_settings_footer_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"platform" "enum_site_settings_footer_social_links_platform"
  );
  
  CREATE TABLE "site_settings_llms_key_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_title" varchar,
  	"footer_tagline" varchar,
  	"footer_copyright_holder" varchar,
  	"llms_summary" varchar,
  	"llms_pitch" varchar,
  	"llms_last_reviewed" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_site_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_site_settings_v_version_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_footer_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"platform" "enum__site_settings_v_version_footer_social_links_platform",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_llms_key_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_site_title" varchar,
  	"version_footer_tagline" varchar,
  	"version_footer_copyright_holder" varchar,
  	"version_llms_summary" varchar,
  	"version_llms_pitch" varchar,
  	"version_llms_last_reviewed" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__site_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "legal" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"imprint" varchar,
  	"privacy_policy" varchar,
  	"terms_and_conditions" varchar,
  	"last_edited_by" varchar,
  	"last_edited_at" timestamp(3) with time zone,
  	"last_published_by" varchar,
  	"last_published_at" timestamp(3) with time zone,
  	"_status" "enum_legal_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_legal_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_imprint" varchar,
  	"version_privacy_policy" varchar,
  	"version_terms_and_conditions" varchar,
  	"version_last_edited_by" varchar,
  	"version_last_edited_at" timestamp(3) with time zone,
  	"version_last_published_by" varchar,
  	"version_last_published_at" timestamp(3) with time zone,
  	"version__status" "enum__legal_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_parent_id_partners_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_parent_id_jobs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "speakers" ADD CONSTRAINT "speakers_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_speakers_v" ADD CONSTRAINT "_speakers_v_parent_id_speakers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."speakers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_speakers_v" ADD CONSTRAINT "_speakers_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team" ADD CONSTRAINT "team_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_v" ADD CONSTRAINT "_team_v_parent_id_team_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_v" ADD CONSTRAINT "_team_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "past_teams" ADD CONSTRAINT "past_teams_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_past_teams_v" ADD CONSTRAINT "_past_teams_v_parent_id_past_teams_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."past_teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_past_teams_v" ADD CONSTRAINT "_past_teams_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_parent_id_faqs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faqs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_parent_id_testimonials_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_divisions" ADD CONSTRAINT "users_divisions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_speakers_fk" FOREIGN KEY ("speakers_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_past_teams_fk" FOREIGN KEY ("past_teams_id") REFERENCES "public"."past_teams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_hero_announcement_lines" ADD CONSTRAINT "page_home_hero_announcement_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_stats_items_logos" ADD CONSTRAINT "page_home_stats_items_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_stats_items" ADD CONSTRAINT "page_home_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_partner_band_items_logos" ADD CONSTRAINT "page_home_partner_band_items_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home_partner_band_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_partner_band_items" ADD CONSTRAINT "page_home_partner_band_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home_why_attend_cards" ADD CONSTRAINT "page_home_why_attend_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_hero_announcement_lines" ADD CONSTRAINT "_page_home_v_version_hero_announcement_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_stats_items_logos" ADD CONSTRAINT "_page_home_v_version_stats_items_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v_version_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_stats_items" ADD CONSTRAINT "_page_home_v_version_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_partner_band_items_logos" ADD CONSTRAINT "_page_home_v_version_partner_band_items_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v_version_partner_band_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_partner_band_items" ADD CONSTRAINT "_page_home_v_version_partner_band_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_home_v_version_why_attend_cards" ADD CONSTRAINT "_page_home_v_version_why_attend_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_audiences_items" ADD CONSTRAINT "page_whyq_audiences_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq_audiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_whyq_audiences" ADD CONSTRAINT "page_whyq_audiences_image_file_id_media_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_whyq_audiences" ADD CONSTRAINT "page_whyq_audiences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_whyq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_audiences_items" ADD CONSTRAINT "_page_whyq_v_version_audiences_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v_version_audiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_audiences" ADD CONSTRAINT "_page_whyq_v_version_audiences_image_file_id_media_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_page_whyq_v_version_audiences" ADD CONSTRAINT "_page_whyq_v_version_audiences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_whyq_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_speaker_panels" ADD CONSTRAINT "page_speaker_panels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_speaker"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_speaker_v_version_panels" ADD CONSTRAINT "_page_speaker_v_version_panels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_speaker_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_program_agenda_items" ADD CONSTRAINT "page_program_agenda_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_program"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_program_v_version_agenda_items" ADD CONSTRAINT "_page_program_v_version_agenda_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_program_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_hackathon_partners_groups_partners" ADD CONSTRAINT "page_hackathon_partners_groups_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_hackathon_partners_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_hackathon_partners_groups" ADD CONSTRAINT "page_hackathon_partners_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_hackathon"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_hackathon_benefits_cards" ADD CONSTRAINT "page_hackathon_benefits_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_hackathon"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_hackathon_schedule_items" ADD CONSTRAINT "page_hackathon_schedule_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_hackathon"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_hackathon_v_version_partners_groups_partners" ADD CONSTRAINT "_page_hackathon_v_version_partners_groups_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_hackathon_v_version_partners_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_hackathon_v_version_partners_groups" ADD CONSTRAINT "_page_hackathon_v_version_partners_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_hackathon_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_hackathon_v_version_benefits_cards" ADD CONSTRAINT "_page_hackathon_v_version_benefits_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_hackathon_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_hackathon_v_version_schedule_items" ADD CONSTRAINT "_page_hackathon_v_version_schedule_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_hackathon_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_tiers_items_features" ADD CONSTRAINT "page_tickets_tiers_items_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets_tiers_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_tiers_items" ADD CONSTRAINT "page_tickets_tiers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_comparison_tiers" ADD CONSTRAINT "page_tickets_comparison_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_comparison_groups_rows_included" ADD CONSTRAINT "page_tickets_comparison_groups_rows_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets_comparison_groups_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_comparison_groups_rows" ADD CONSTRAINT "page_tickets_comparison_groups_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets_comparison_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_comparison_groups" ADD CONSTRAINT "page_tickets_comparison_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_categories_items_bullets" ADD CONSTRAINT "page_tickets_categories_items_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets_categories_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_tickets_categories_items" ADD CONSTRAINT "page_tickets_categories_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_tiers_items_features" ADD CONSTRAINT "_page_tickets_v_version_tiers_items_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v_version_tiers_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_tiers_items" ADD CONSTRAINT "_page_tickets_v_version_tiers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_comparison_tiers" ADD CONSTRAINT "_page_tickets_v_version_comparison_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_comparison_groups_rows_included" ADD CONSTRAINT "_page_tickets_v_version_comparison_groups_rows_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v_version_comparison_groups_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_comparison_groups_rows" ADD CONSTRAINT "_page_tickets_v_version_comparison_groups_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v_version_comparison_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_comparison_groups" ADD CONSTRAINT "_page_tickets_v_version_comparison_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_categories_items_bullets" ADD CONSTRAINT "_page_tickets_v_version_categories_items_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v_version_categories_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_tickets_v_version_categories_items" ADD CONSTRAINT "_page_tickets_v_version_categories_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_tickets_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_contact_board_paragraphs" ADD CONSTRAINT "page_contact_board_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_contact_board_members" ADD CONSTRAINT "page_contact_board_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_contact_reach_out_paragraphs" ADD CONSTRAINT "page_contact_reach_out_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_contact_reach_out_items_details" ADD CONSTRAINT "page_contact_reach_out_items_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_contact_reach_out_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_contact_reach_out_items" ADD CONSTRAINT "page_contact_reach_out_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_contact_v_version_board_paragraphs" ADD CONSTRAINT "_page_contact_v_version_board_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_contact_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_contact_v_version_board_members" ADD CONSTRAINT "_page_contact_v_version_board_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_contact_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_contact_v_version_reach_out_paragraphs" ADD CONSTRAINT "_page_contact_v_version_reach_out_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_contact_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_contact_v_version_reach_out_items_details" ADD CONSTRAINT "_page_contact_v_version_reach_out_items_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_contact_v_version_reach_out_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_page_contact_v_version_reach_out_items" ADD CONSTRAINT "_page_contact_v_version_reach_out_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_page_contact_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_nav" ADD CONSTRAINT "site_settings_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_links" ADD CONSTRAINT "site_settings_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_social_links" ADD CONSTRAINT "site_settings_footer_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_llms_key_facts" ADD CONSTRAINT "site_settings_llms_key_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_nav" ADD CONSTRAINT "_site_settings_v_version_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_links" ADD CONSTRAINT "_site_settings_v_version_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_footer_social_links" ADD CONSTRAINT "_site_settings_v_version_footer_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_llms_key_facts" ADD CONSTRAINT "_site_settings_v_version_llms_key_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "partners_name_idx" ON "partners" USING btree ("name");
  CREATE INDEX "partners_logo_idx" ON "partners" USING btree ("logo_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE INDEX "partners__status_idx" ON "partners" USING btree ("_status");
  CREATE INDEX "_partners_v_parent_idx" ON "_partners_v" USING btree ("parent_id");
  CREATE INDEX "_partners_v_version_version_name_idx" ON "_partners_v" USING btree ("version_name");
  CREATE INDEX "_partners_v_version_version_logo_idx" ON "_partners_v" USING btree ("version_logo_id");
  CREATE INDEX "_partners_v_version_version_updated_at_idx" ON "_partners_v" USING btree ("version_updated_at");
  CREATE INDEX "_partners_v_version_version_created_at_idx" ON "_partners_v" USING btree ("version_created_at");
  CREATE INDEX "_partners_v_version_version__status_idx" ON "_partners_v" USING btree ("version__status");
  CREATE INDEX "_partners_v_created_at_idx" ON "_partners_v" USING btree ("created_at");
  CREATE INDEX "_partners_v_updated_at_idx" ON "_partners_v" USING btree ("updated_at");
  CREATE INDEX "_partners_v_latest_idx" ON "_partners_v" USING btree ("latest");
  CREATE INDEX "jobs_logo_idx" ON "jobs" USING btree ("logo_id");
  CREATE UNIQUE INDEX "jobs_slug_idx" ON "jobs" USING btree ("slug");
  CREATE INDEX "jobs_updated_at_idx" ON "jobs" USING btree ("updated_at");
  CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");
  CREATE INDEX "jobs__status_idx" ON "jobs" USING btree ("_status");
  CREATE INDEX "_jobs_v_parent_idx" ON "_jobs_v" USING btree ("parent_id");
  CREATE INDEX "_jobs_v_version_version_logo_idx" ON "_jobs_v" USING btree ("version_logo_id");
  CREATE INDEX "_jobs_v_version_version_slug_idx" ON "_jobs_v" USING btree ("version_slug");
  CREATE INDEX "_jobs_v_version_version_updated_at_idx" ON "_jobs_v" USING btree ("version_updated_at");
  CREATE INDEX "_jobs_v_version_version_created_at_idx" ON "_jobs_v" USING btree ("version_created_at");
  CREATE INDEX "_jobs_v_version_version__status_idx" ON "_jobs_v" USING btree ("version__status");
  CREATE INDEX "_jobs_v_created_at_idx" ON "_jobs_v" USING btree ("created_at");
  CREATE INDEX "_jobs_v_updated_at_idx" ON "_jobs_v" USING btree ("updated_at");
  CREATE INDEX "_jobs_v_latest_idx" ON "_jobs_v" USING btree ("latest");
  CREATE INDEX "speakers_photo_idx" ON "speakers" USING btree ("photo_id");
  CREATE INDEX "speakers_updated_at_idx" ON "speakers" USING btree ("updated_at");
  CREATE INDEX "speakers_created_at_idx" ON "speakers" USING btree ("created_at");
  CREATE INDEX "speakers__status_idx" ON "speakers" USING btree ("_status");
  CREATE INDEX "_speakers_v_parent_idx" ON "_speakers_v" USING btree ("parent_id");
  CREATE INDEX "_speakers_v_version_version_photo_idx" ON "_speakers_v" USING btree ("version_photo_id");
  CREATE INDEX "_speakers_v_version_version_updated_at_idx" ON "_speakers_v" USING btree ("version_updated_at");
  CREATE INDEX "_speakers_v_version_version_created_at_idx" ON "_speakers_v" USING btree ("version_created_at");
  CREATE INDEX "_speakers_v_version_version__status_idx" ON "_speakers_v" USING btree ("version__status");
  CREATE INDEX "_speakers_v_created_at_idx" ON "_speakers_v" USING btree ("created_at");
  CREATE INDEX "_speakers_v_updated_at_idx" ON "_speakers_v" USING btree ("updated_at");
  CREATE INDEX "_speakers_v_latest_idx" ON "_speakers_v" USING btree ("latest");
  CREATE INDEX "team_photo_idx" ON "team" USING btree ("photo_id");
  CREATE INDEX "team_updated_at_idx" ON "team" USING btree ("updated_at");
  CREATE INDEX "team_created_at_idx" ON "team" USING btree ("created_at");
  CREATE INDEX "team__status_idx" ON "team" USING btree ("_status");
  CREATE INDEX "_team_v_parent_idx" ON "_team_v" USING btree ("parent_id");
  CREATE INDEX "_team_v_version_version_photo_idx" ON "_team_v" USING btree ("version_photo_id");
  CREATE INDEX "_team_v_version_version_updated_at_idx" ON "_team_v" USING btree ("version_updated_at");
  CREATE INDEX "_team_v_version_version_created_at_idx" ON "_team_v" USING btree ("version_created_at");
  CREATE INDEX "_team_v_version_version__status_idx" ON "_team_v" USING btree ("version__status");
  CREATE INDEX "_team_v_created_at_idx" ON "_team_v" USING btree ("created_at");
  CREATE INDEX "_team_v_updated_at_idx" ON "_team_v" USING btree ("updated_at");
  CREATE INDEX "_team_v_latest_idx" ON "_team_v" USING btree ("latest");
  CREATE UNIQUE INDEX "past_teams_year_idx" ON "past_teams" USING btree ("year");
  CREATE INDEX "past_teams_photo_idx" ON "past_teams" USING btree ("photo_id");
  CREATE INDEX "past_teams_updated_at_idx" ON "past_teams" USING btree ("updated_at");
  CREATE INDEX "past_teams_created_at_idx" ON "past_teams" USING btree ("created_at");
  CREATE INDEX "past_teams__status_idx" ON "past_teams" USING btree ("_status");
  CREATE INDEX "_past_teams_v_parent_idx" ON "_past_teams_v" USING btree ("parent_id");
  CREATE INDEX "_past_teams_v_version_version_year_idx" ON "_past_teams_v" USING btree ("version_year");
  CREATE INDEX "_past_teams_v_version_version_photo_idx" ON "_past_teams_v" USING btree ("version_photo_id");
  CREATE INDEX "_past_teams_v_version_version_updated_at_idx" ON "_past_teams_v" USING btree ("version_updated_at");
  CREATE INDEX "_past_teams_v_version_version_created_at_idx" ON "_past_teams_v" USING btree ("version_created_at");
  CREATE INDEX "_past_teams_v_version_version__status_idx" ON "_past_teams_v" USING btree ("version__status");
  CREATE INDEX "_past_teams_v_created_at_idx" ON "_past_teams_v" USING btree ("created_at");
  CREATE INDEX "_past_teams_v_updated_at_idx" ON "_past_teams_v" USING btree ("updated_at");
  CREATE INDEX "_past_teams_v_latest_idx" ON "_past_teams_v" USING btree ("latest");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "faqs__status_idx" ON "faqs" USING btree ("_status");
  CREATE INDEX "_faqs_v_parent_idx" ON "_faqs_v" USING btree ("parent_id");
  CREATE INDEX "_faqs_v_version_version_updated_at_idx" ON "_faqs_v" USING btree ("version_updated_at");
  CREATE INDEX "_faqs_v_version_version_created_at_idx" ON "_faqs_v" USING btree ("version_created_at");
  CREATE INDEX "_faqs_v_version_version__status_idx" ON "_faqs_v" USING btree ("version__status");
  CREATE INDEX "_faqs_v_created_at_idx" ON "_faqs_v" USING btree ("created_at");
  CREATE INDEX "_faqs_v_updated_at_idx" ON "_faqs_v" USING btree ("updated_at");
  CREATE INDEX "_faqs_v_latest_idx" ON "_faqs_v" USING btree ("latest");
  CREATE UNIQUE INDEX "testimonials_attribution_idx" ON "testimonials" USING btree ("attribution");
  CREATE INDEX "testimonials_photo_idx" ON "testimonials" USING btree ("photo_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "testimonials__status_idx" ON "testimonials" USING btree ("_status");
  CREATE INDEX "_testimonials_v_parent_idx" ON "_testimonials_v" USING btree ("parent_id");
  CREATE INDEX "_testimonials_v_version_version_attribution_idx" ON "_testimonials_v" USING btree ("version_attribution");
  CREATE INDEX "_testimonials_v_version_version_photo_idx" ON "_testimonials_v" USING btree ("version_photo_id");
  CREATE INDEX "_testimonials_v_version_version_updated_at_idx" ON "_testimonials_v" USING btree ("version_updated_at");
  CREATE INDEX "_testimonials_v_version_version_created_at_idx" ON "_testimonials_v" USING btree ("version_created_at");
  CREATE INDEX "_testimonials_v_version_version__status_idx" ON "_testimonials_v" USING btree ("version__status");
  CREATE INDEX "_testimonials_v_created_at_idx" ON "_testimonials_v" USING btree ("created_at");
  CREATE INDEX "_testimonials_v_updated_at_idx" ON "_testimonials_v" USING btree ("updated_at");
  CREATE INDEX "_testimonials_v_latest_idx" ON "_testimonials_v" USING btree ("latest");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "users_divisions_order_idx" ON "users_divisions" USING btree ("order");
  CREATE INDEX "users_divisions_parent_idx" ON "users_divisions" USING btree ("parent_id");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_sub_idx" ON "users" USING btree ("sub");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("jobs_id");
  CREATE INDEX "payload_locked_documents_rels_speakers_id_idx" ON "payload_locked_documents_rels" USING btree ("speakers_id");
  CREATE INDEX "payload_locked_documents_rels_team_id_idx" ON "payload_locked_documents_rels" USING btree ("team_id");
  CREATE INDEX "payload_locked_documents_rels_past_teams_id_idx" ON "payload_locked_documents_rels" USING btree ("past_teams_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "page_home_hero_announcement_lines_order_idx" ON "page_home_hero_announcement_lines" USING btree ("_order");
  CREATE INDEX "page_home_hero_announcement_lines_parent_id_idx" ON "page_home_hero_announcement_lines" USING btree ("_parent_id");
  CREATE INDEX "page_home_stats_items_logos_order_idx" ON "page_home_stats_items_logos" USING btree ("_order");
  CREATE INDEX "page_home_stats_items_logos_parent_id_idx" ON "page_home_stats_items_logos" USING btree ("_parent_id");
  CREATE INDEX "page_home_stats_items_order_idx" ON "page_home_stats_items" USING btree ("_order");
  CREATE INDEX "page_home_stats_items_parent_id_idx" ON "page_home_stats_items" USING btree ("_parent_id");
  CREATE INDEX "page_home_partner_band_items_logos_order_idx" ON "page_home_partner_band_items_logos" USING btree ("_order");
  CREATE INDEX "page_home_partner_band_items_logos_parent_id_idx" ON "page_home_partner_band_items_logos" USING btree ("_parent_id");
  CREATE INDEX "page_home_partner_band_items_order_idx" ON "page_home_partner_band_items" USING btree ("_order");
  CREATE INDEX "page_home_partner_band_items_parent_id_idx" ON "page_home_partner_band_items" USING btree ("_parent_id");
  CREATE INDEX "page_home_why_attend_cards_order_idx" ON "page_home_why_attend_cards" USING btree ("_order");
  CREATE INDEX "page_home_why_attend_cards_parent_id_idx" ON "page_home_why_attend_cards" USING btree ("_parent_id");
  CREATE INDEX "page_home__status_idx" ON "page_home" USING btree ("_status");
  CREATE INDEX "_page_home_v_version_hero_announcement_lines_order_idx" ON "_page_home_v_version_hero_announcement_lines" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_hero_announcement_lines_parent_id_idx" ON "_page_home_v_version_hero_announcement_lines" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_stats_items_logos_order_idx" ON "_page_home_v_version_stats_items_logos" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_stats_items_logos_parent_id_idx" ON "_page_home_v_version_stats_items_logos" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_stats_items_order_idx" ON "_page_home_v_version_stats_items" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_stats_items_parent_id_idx" ON "_page_home_v_version_stats_items" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_partner_band_items_logos_order_idx" ON "_page_home_v_version_partner_band_items_logos" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_partner_band_items_logos_parent_id_idx" ON "_page_home_v_version_partner_band_items_logos" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_partner_band_items_order_idx" ON "_page_home_v_version_partner_band_items" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_partner_band_items_parent_id_idx" ON "_page_home_v_version_partner_band_items" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_why_attend_cards_order_idx" ON "_page_home_v_version_why_attend_cards" USING btree ("_order");
  CREATE INDEX "_page_home_v_version_why_attend_cards_parent_id_idx" ON "_page_home_v_version_why_attend_cards" USING btree ("_parent_id");
  CREATE INDEX "_page_home_v_version_version__status_idx" ON "_page_home_v" USING btree ("version__status");
  CREATE INDEX "_page_home_v_created_at_idx" ON "_page_home_v" USING btree ("created_at");
  CREATE INDEX "_page_home_v_updated_at_idx" ON "_page_home_v" USING btree ("updated_at");
  CREATE INDEX "_page_home_v_latest_idx" ON "_page_home_v" USING btree ("latest");
  CREATE INDEX "page_whyq_audiences_items_order_idx" ON "page_whyq_audiences_items" USING btree ("_order");
  CREATE INDEX "page_whyq_audiences_items_parent_id_idx" ON "page_whyq_audiences_items" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_audiences_order_idx" ON "page_whyq_audiences" USING btree ("_order");
  CREATE INDEX "page_whyq_audiences_parent_id_idx" ON "page_whyq_audiences" USING btree ("_parent_id");
  CREATE INDEX "page_whyq_audiences_image_file_idx" ON "page_whyq_audiences" USING btree ("image_file_id");
  CREATE INDEX "page_whyq__status_idx" ON "page_whyq" USING btree ("_status");
  CREATE INDEX "_page_whyq_v_version_audiences_items_order_idx" ON "_page_whyq_v_version_audiences_items" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_audiences_items_parent_id_idx" ON "_page_whyq_v_version_audiences_items" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_audiences_order_idx" ON "_page_whyq_v_version_audiences" USING btree ("_order");
  CREATE INDEX "_page_whyq_v_version_audiences_parent_id_idx" ON "_page_whyq_v_version_audiences" USING btree ("_parent_id");
  CREATE INDEX "_page_whyq_v_version_audiences_image_file_idx" ON "_page_whyq_v_version_audiences" USING btree ("image_file_id");
  CREATE INDEX "_page_whyq_v_version_version__status_idx" ON "_page_whyq_v" USING btree ("version__status");
  CREATE INDEX "_page_whyq_v_created_at_idx" ON "_page_whyq_v" USING btree ("created_at");
  CREATE INDEX "_page_whyq_v_updated_at_idx" ON "_page_whyq_v" USING btree ("updated_at");
  CREATE INDEX "_page_whyq_v_latest_idx" ON "_page_whyq_v" USING btree ("latest");
  CREATE INDEX "page_speaker_panels_order_idx" ON "page_speaker_panels" USING btree ("_order");
  CREATE INDEX "page_speaker_panels_parent_id_idx" ON "page_speaker_panels" USING btree ("_parent_id");
  CREATE INDEX "page_speaker__status_idx" ON "page_speaker" USING btree ("_status");
  CREATE INDEX "_page_speaker_v_version_panels_order_idx" ON "_page_speaker_v_version_panels" USING btree ("_order");
  CREATE INDEX "_page_speaker_v_version_panels_parent_id_idx" ON "_page_speaker_v_version_panels" USING btree ("_parent_id");
  CREATE INDEX "_page_speaker_v_version_version__status_idx" ON "_page_speaker_v" USING btree ("version__status");
  CREATE INDEX "_page_speaker_v_created_at_idx" ON "_page_speaker_v" USING btree ("created_at");
  CREATE INDEX "_page_speaker_v_updated_at_idx" ON "_page_speaker_v" USING btree ("updated_at");
  CREATE INDEX "_page_speaker_v_latest_idx" ON "_page_speaker_v" USING btree ("latest");
  CREATE INDEX "page_partner__status_idx" ON "page_partner" USING btree ("_status");
  CREATE INDEX "_page_partner_v_version_version__status_idx" ON "_page_partner_v" USING btree ("version__status");
  CREATE INDEX "_page_partner_v_created_at_idx" ON "_page_partner_v" USING btree ("created_at");
  CREATE INDEX "_page_partner_v_updated_at_idx" ON "_page_partner_v" USING btree ("updated_at");
  CREATE INDEX "_page_partner_v_latest_idx" ON "_page_partner_v" USING btree ("latest");
  CREATE INDEX "page_program_agenda_items_order_idx" ON "page_program_agenda_items" USING btree ("_order");
  CREATE INDEX "page_program_agenda_items_parent_id_idx" ON "page_program_agenda_items" USING btree ("_parent_id");
  CREATE INDEX "page_program__status_idx" ON "page_program" USING btree ("_status");
  CREATE INDEX "_page_program_v_version_agenda_items_order_idx" ON "_page_program_v_version_agenda_items" USING btree ("_order");
  CREATE INDEX "_page_program_v_version_agenda_items_parent_id_idx" ON "_page_program_v_version_agenda_items" USING btree ("_parent_id");
  CREATE INDEX "_page_program_v_version_version__status_idx" ON "_page_program_v" USING btree ("version__status");
  CREATE INDEX "_page_program_v_created_at_idx" ON "_page_program_v" USING btree ("created_at");
  CREATE INDEX "_page_program_v_updated_at_idx" ON "_page_program_v" USING btree ("updated_at");
  CREATE INDEX "_page_program_v_latest_idx" ON "_page_program_v" USING btree ("latest");
  CREATE INDEX "page_hackathon_partners_groups_partners_order_idx" ON "page_hackathon_partners_groups_partners" USING btree ("_order");
  CREATE INDEX "page_hackathon_partners_groups_partners_parent_id_idx" ON "page_hackathon_partners_groups_partners" USING btree ("_parent_id");
  CREATE INDEX "page_hackathon_partners_groups_order_idx" ON "page_hackathon_partners_groups" USING btree ("_order");
  CREATE INDEX "page_hackathon_partners_groups_parent_id_idx" ON "page_hackathon_partners_groups" USING btree ("_parent_id");
  CREATE INDEX "page_hackathon_benefits_cards_order_idx" ON "page_hackathon_benefits_cards" USING btree ("_order");
  CREATE INDEX "page_hackathon_benefits_cards_parent_id_idx" ON "page_hackathon_benefits_cards" USING btree ("_parent_id");
  CREATE INDEX "page_hackathon_schedule_items_order_idx" ON "page_hackathon_schedule_items" USING btree ("_order");
  CREATE INDEX "page_hackathon_schedule_items_parent_id_idx" ON "page_hackathon_schedule_items" USING btree ("_parent_id");
  CREATE INDEX "page_hackathon__status_idx" ON "page_hackathon" USING btree ("_status");
  CREATE INDEX "_page_hackathon_v_version_partners_groups_partners_order_idx" ON "_page_hackathon_v_version_partners_groups_partners" USING btree ("_order");
  CREATE INDEX "_page_hackathon_v_version_partners_groups_partners_parent_id_idx" ON "_page_hackathon_v_version_partners_groups_partners" USING btree ("_parent_id");
  CREATE INDEX "_page_hackathon_v_version_partners_groups_order_idx" ON "_page_hackathon_v_version_partners_groups" USING btree ("_order");
  CREATE INDEX "_page_hackathon_v_version_partners_groups_parent_id_idx" ON "_page_hackathon_v_version_partners_groups" USING btree ("_parent_id");
  CREATE INDEX "_page_hackathon_v_version_benefits_cards_order_idx" ON "_page_hackathon_v_version_benefits_cards" USING btree ("_order");
  CREATE INDEX "_page_hackathon_v_version_benefits_cards_parent_id_idx" ON "_page_hackathon_v_version_benefits_cards" USING btree ("_parent_id");
  CREATE INDEX "_page_hackathon_v_version_schedule_items_order_idx" ON "_page_hackathon_v_version_schedule_items" USING btree ("_order");
  CREATE INDEX "_page_hackathon_v_version_schedule_items_parent_id_idx" ON "_page_hackathon_v_version_schedule_items" USING btree ("_parent_id");
  CREATE INDEX "_page_hackathon_v_version_version__status_idx" ON "_page_hackathon_v" USING btree ("version__status");
  CREATE INDEX "_page_hackathon_v_created_at_idx" ON "_page_hackathon_v" USING btree ("created_at");
  CREATE INDEX "_page_hackathon_v_updated_at_idx" ON "_page_hackathon_v" USING btree ("updated_at");
  CREATE INDEX "_page_hackathon_v_latest_idx" ON "_page_hackathon_v" USING btree ("latest");
  CREATE INDEX "page_our_team__status_idx" ON "page_our_team" USING btree ("_status");
  CREATE INDEX "_page_our_team_v_version_version__status_idx" ON "_page_our_team_v" USING btree ("version__status");
  CREATE INDEX "_page_our_team_v_created_at_idx" ON "_page_our_team_v" USING btree ("created_at");
  CREATE INDEX "_page_our_team_v_updated_at_idx" ON "_page_our_team_v" USING btree ("updated_at");
  CREATE INDEX "_page_our_team_v_latest_idx" ON "_page_our_team_v" USING btree ("latest");
  CREATE INDEX "page_jobs__status_idx" ON "page_jobs" USING btree ("_status");
  CREATE INDEX "_page_jobs_v_version_version__status_idx" ON "_page_jobs_v" USING btree ("version__status");
  CREATE INDEX "_page_jobs_v_created_at_idx" ON "_page_jobs_v" USING btree ("created_at");
  CREATE INDEX "_page_jobs_v_updated_at_idx" ON "_page_jobs_v" USING btree ("updated_at");
  CREATE INDEX "_page_jobs_v_latest_idx" ON "_page_jobs_v" USING btree ("latest");
  CREATE INDEX "page_tickets_tiers_items_features_order_idx" ON "page_tickets_tiers_items_features" USING btree ("_order");
  CREATE INDEX "page_tickets_tiers_items_features_parent_id_idx" ON "page_tickets_tiers_items_features" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_tiers_items_order_idx" ON "page_tickets_tiers_items" USING btree ("_order");
  CREATE INDEX "page_tickets_tiers_items_parent_id_idx" ON "page_tickets_tiers_items" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_comparison_tiers_order_idx" ON "page_tickets_comparison_tiers" USING btree ("_order");
  CREATE INDEX "page_tickets_comparison_tiers_parent_id_idx" ON "page_tickets_comparison_tiers" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_comparison_groups_rows_included_order_idx" ON "page_tickets_comparison_groups_rows_included" USING btree ("_order");
  CREATE INDEX "page_tickets_comparison_groups_rows_included_parent_id_idx" ON "page_tickets_comparison_groups_rows_included" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_comparison_groups_rows_order_idx" ON "page_tickets_comparison_groups_rows" USING btree ("_order");
  CREATE INDEX "page_tickets_comparison_groups_rows_parent_id_idx" ON "page_tickets_comparison_groups_rows" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_comparison_groups_order_idx" ON "page_tickets_comparison_groups" USING btree ("_order");
  CREATE INDEX "page_tickets_comparison_groups_parent_id_idx" ON "page_tickets_comparison_groups" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_categories_items_bullets_order_idx" ON "page_tickets_categories_items_bullets" USING btree ("_order");
  CREATE INDEX "page_tickets_categories_items_bullets_parent_id_idx" ON "page_tickets_categories_items_bullets" USING btree ("_parent_id");
  CREATE INDEX "page_tickets_categories_items_order_idx" ON "page_tickets_categories_items" USING btree ("_order");
  CREATE INDEX "page_tickets_categories_items_parent_id_idx" ON "page_tickets_categories_items" USING btree ("_parent_id");
  CREATE INDEX "page_tickets__status_idx" ON "page_tickets" USING btree ("_status");
  CREATE INDEX "_page_tickets_v_version_tiers_items_features_order_idx" ON "_page_tickets_v_version_tiers_items_features" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_tiers_items_features_parent_id_idx" ON "_page_tickets_v_version_tiers_items_features" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_tiers_items_order_idx" ON "_page_tickets_v_version_tiers_items" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_tiers_items_parent_id_idx" ON "_page_tickets_v_version_tiers_items" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_comparison_tiers_order_idx" ON "_page_tickets_v_version_comparison_tiers" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_comparison_tiers_parent_id_idx" ON "_page_tickets_v_version_comparison_tiers" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_comparison_groups_rows_included_order_idx" ON "_page_tickets_v_version_comparison_groups_rows_included" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_comparison_groups_rows_included_parent_id_idx" ON "_page_tickets_v_version_comparison_groups_rows_included" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_comparison_groups_rows_order_idx" ON "_page_tickets_v_version_comparison_groups_rows" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_comparison_groups_rows_parent_id_idx" ON "_page_tickets_v_version_comparison_groups_rows" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_comparison_groups_order_idx" ON "_page_tickets_v_version_comparison_groups" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_comparison_groups_parent_id_idx" ON "_page_tickets_v_version_comparison_groups" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_categories_items_bullets_order_idx" ON "_page_tickets_v_version_categories_items_bullets" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_categories_items_bullets_parent_id_idx" ON "_page_tickets_v_version_categories_items_bullets" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_categories_items_order_idx" ON "_page_tickets_v_version_categories_items" USING btree ("_order");
  CREATE INDEX "_page_tickets_v_version_categories_items_parent_id_idx" ON "_page_tickets_v_version_categories_items" USING btree ("_parent_id");
  CREATE INDEX "_page_tickets_v_version_version__status_idx" ON "_page_tickets_v" USING btree ("version__status");
  CREATE INDEX "_page_tickets_v_created_at_idx" ON "_page_tickets_v" USING btree ("created_at");
  CREATE INDEX "_page_tickets_v_updated_at_idx" ON "_page_tickets_v" USING btree ("updated_at");
  CREATE INDEX "_page_tickets_v_latest_idx" ON "_page_tickets_v" USING btree ("latest");
  CREATE INDEX "page_contact_board_paragraphs_order_idx" ON "page_contact_board_paragraphs" USING btree ("_order");
  CREATE INDEX "page_contact_board_paragraphs_parent_id_idx" ON "page_contact_board_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "page_contact_board_members_order_idx" ON "page_contact_board_members" USING btree ("_order");
  CREATE INDEX "page_contact_board_members_parent_id_idx" ON "page_contact_board_members" USING btree ("_parent_id");
  CREATE INDEX "page_contact_reach_out_paragraphs_order_idx" ON "page_contact_reach_out_paragraphs" USING btree ("_order");
  CREATE INDEX "page_contact_reach_out_paragraphs_parent_id_idx" ON "page_contact_reach_out_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "page_contact_reach_out_items_details_order_idx" ON "page_contact_reach_out_items_details" USING btree ("_order");
  CREATE INDEX "page_contact_reach_out_items_details_parent_id_idx" ON "page_contact_reach_out_items_details" USING btree ("_parent_id");
  CREATE INDEX "page_contact_reach_out_items_order_idx" ON "page_contact_reach_out_items" USING btree ("_order");
  CREATE INDEX "page_contact_reach_out_items_parent_id_idx" ON "page_contact_reach_out_items" USING btree ("_parent_id");
  CREATE INDEX "page_contact__status_idx" ON "page_contact" USING btree ("_status");
  CREATE INDEX "_page_contact_v_version_board_paragraphs_order_idx" ON "_page_contact_v_version_board_paragraphs" USING btree ("_order");
  CREATE INDEX "_page_contact_v_version_board_paragraphs_parent_id_idx" ON "_page_contact_v_version_board_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_page_contact_v_version_board_members_order_idx" ON "_page_contact_v_version_board_members" USING btree ("_order");
  CREATE INDEX "_page_contact_v_version_board_members_parent_id_idx" ON "_page_contact_v_version_board_members" USING btree ("_parent_id");
  CREATE INDEX "_page_contact_v_version_reach_out_paragraphs_order_idx" ON "_page_contact_v_version_reach_out_paragraphs" USING btree ("_order");
  CREATE INDEX "_page_contact_v_version_reach_out_paragraphs_parent_id_idx" ON "_page_contact_v_version_reach_out_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_page_contact_v_version_reach_out_items_details_order_idx" ON "_page_contact_v_version_reach_out_items_details" USING btree ("_order");
  CREATE INDEX "_page_contact_v_version_reach_out_items_details_parent_id_idx" ON "_page_contact_v_version_reach_out_items_details" USING btree ("_parent_id");
  CREATE INDEX "_page_contact_v_version_reach_out_items_order_idx" ON "_page_contact_v_version_reach_out_items" USING btree ("_order");
  CREATE INDEX "_page_contact_v_version_reach_out_items_parent_id_idx" ON "_page_contact_v_version_reach_out_items" USING btree ("_parent_id");
  CREATE INDEX "_page_contact_v_version_version__status_idx" ON "_page_contact_v" USING btree ("version__status");
  CREATE INDEX "_page_contact_v_created_at_idx" ON "_page_contact_v" USING btree ("created_at");
  CREATE INDEX "_page_contact_v_updated_at_idx" ON "_page_contact_v" USING btree ("updated_at");
  CREATE INDEX "_page_contact_v_latest_idx" ON "_page_contact_v" USING btree ("latest");
  CREATE INDEX "page_past_teams__status_idx" ON "page_past_teams" USING btree ("_status");
  CREATE INDEX "_page_past_teams_v_version_version__status_idx" ON "_page_past_teams_v" USING btree ("version__status");
  CREATE INDEX "_page_past_teams_v_created_at_idx" ON "_page_past_teams_v" USING btree ("created_at");
  CREATE INDEX "_page_past_teams_v_updated_at_idx" ON "_page_past_teams_v" USING btree ("updated_at");
  CREATE INDEX "_page_past_teams_v_latest_idx" ON "_page_past_teams_v" USING btree ("latest");
  CREATE INDEX "site_settings_nav_order_idx" ON "site_settings_nav" USING btree ("_order");
  CREATE INDEX "site_settings_nav_parent_id_idx" ON "site_settings_nav" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_links_order_idx" ON "site_settings_footer_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_links_parent_id_idx" ON "site_settings_footer_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_social_links_order_idx" ON "site_settings_footer_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_social_links_parent_id_idx" ON "site_settings_footer_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_llms_key_facts_order_idx" ON "site_settings_llms_key_facts" USING btree ("_order");
  CREATE INDEX "site_settings_llms_key_facts_parent_id_idx" ON "site_settings_llms_key_facts" USING btree ("_parent_id");
  CREATE INDEX "site_settings__status_idx" ON "site_settings" USING btree ("_status");
  CREATE INDEX "_site_settings_v_version_nav_order_idx" ON "_site_settings_v_version_nav" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_nav_parent_id_idx" ON "_site_settings_v_version_nav" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_footer_links_order_idx" ON "_site_settings_v_version_footer_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_links_parent_id_idx" ON "_site_settings_v_version_footer_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_footer_social_links_order_idx" ON "_site_settings_v_version_footer_social_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_footer_social_links_parent_id_idx" ON "_site_settings_v_version_footer_social_links" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_llms_key_facts_order_idx" ON "_site_settings_v_version_llms_key_facts" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_llms_key_facts_parent_id_idx" ON "_site_settings_v_version_llms_key_facts" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_version__status_idx" ON "_site_settings_v" USING btree ("version__status");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_latest_idx" ON "_site_settings_v" USING btree ("latest");
  CREATE INDEX "legal__status_idx" ON "legal" USING btree ("_status");
  CREATE INDEX "_legal_v_version_version__status_idx" ON "_legal_v" USING btree ("version__status");
  CREATE INDEX "_legal_v_created_at_idx" ON "_legal_v" USING btree ("created_at");
  CREATE INDEX "_legal_v_updated_at_idx" ON "_legal_v" USING btree ("updated_at");
  CREATE INDEX "_legal_v_latest_idx" ON "_legal_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "partners" CASCADE;
  DROP TABLE "_partners_v" CASCADE;
  DROP TABLE "jobs" CASCADE;
  DROP TABLE "_jobs_v" CASCADE;
  DROP TABLE "speakers" CASCADE;
  DROP TABLE "_speakers_v" CASCADE;
  DROP TABLE "team" CASCADE;
  DROP TABLE "_team_v" CASCADE;
  DROP TABLE "past_teams" CASCADE;
  DROP TABLE "_past_teams_v" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "_faqs_v" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "_testimonials_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_divisions" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "page_home_hero_announcement_lines" CASCADE;
  DROP TABLE "page_home_stats_items_logos" CASCADE;
  DROP TABLE "page_home_stats_items" CASCADE;
  DROP TABLE "page_home_partner_band_items_logos" CASCADE;
  DROP TABLE "page_home_partner_band_items" CASCADE;
  DROP TABLE "page_home_why_attend_cards" CASCADE;
  DROP TABLE "page_home" CASCADE;
  DROP TABLE "_page_home_v_version_hero_announcement_lines" CASCADE;
  DROP TABLE "_page_home_v_version_stats_items_logos" CASCADE;
  DROP TABLE "_page_home_v_version_stats_items" CASCADE;
  DROP TABLE "_page_home_v_version_partner_band_items_logos" CASCADE;
  DROP TABLE "_page_home_v_version_partner_band_items" CASCADE;
  DROP TABLE "_page_home_v_version_why_attend_cards" CASCADE;
  DROP TABLE "_page_home_v" CASCADE;
  DROP TABLE "page_whyq_audiences_items" CASCADE;
  DROP TABLE "page_whyq_audiences" CASCADE;
  DROP TABLE "page_whyq" CASCADE;
  DROP TABLE "_page_whyq_v_version_audiences_items" CASCADE;
  DROP TABLE "_page_whyq_v_version_audiences" CASCADE;
  DROP TABLE "_page_whyq_v" CASCADE;
  DROP TABLE "page_speaker_panels" CASCADE;
  DROP TABLE "page_speaker" CASCADE;
  DROP TABLE "_page_speaker_v_version_panels" CASCADE;
  DROP TABLE "_page_speaker_v" CASCADE;
  DROP TABLE "page_partner" CASCADE;
  DROP TABLE "_page_partner_v" CASCADE;
  DROP TABLE "page_program_agenda_items" CASCADE;
  DROP TABLE "page_program" CASCADE;
  DROP TABLE "_page_program_v_version_agenda_items" CASCADE;
  DROP TABLE "_page_program_v" CASCADE;
  DROP TABLE "page_hackathon_partners_groups_partners" CASCADE;
  DROP TABLE "page_hackathon_partners_groups" CASCADE;
  DROP TABLE "page_hackathon_benefits_cards" CASCADE;
  DROP TABLE "page_hackathon_schedule_items" CASCADE;
  DROP TABLE "page_hackathon" CASCADE;
  DROP TABLE "_page_hackathon_v_version_partners_groups_partners" CASCADE;
  DROP TABLE "_page_hackathon_v_version_partners_groups" CASCADE;
  DROP TABLE "_page_hackathon_v_version_benefits_cards" CASCADE;
  DROP TABLE "_page_hackathon_v_version_schedule_items" CASCADE;
  DROP TABLE "_page_hackathon_v" CASCADE;
  DROP TABLE "page_our_team" CASCADE;
  DROP TABLE "_page_our_team_v" CASCADE;
  DROP TABLE "page_jobs" CASCADE;
  DROP TABLE "_page_jobs_v" CASCADE;
  DROP TABLE "page_tickets_tiers_items_features" CASCADE;
  DROP TABLE "page_tickets_tiers_items" CASCADE;
  DROP TABLE "page_tickets_comparison_tiers" CASCADE;
  DROP TABLE "page_tickets_comparison_groups_rows_included" CASCADE;
  DROP TABLE "page_tickets_comparison_groups_rows" CASCADE;
  DROP TABLE "page_tickets_comparison_groups" CASCADE;
  DROP TABLE "page_tickets_categories_items_bullets" CASCADE;
  DROP TABLE "page_tickets_categories_items" CASCADE;
  DROP TABLE "page_tickets" CASCADE;
  DROP TABLE "_page_tickets_v_version_tiers_items_features" CASCADE;
  DROP TABLE "_page_tickets_v_version_tiers_items" CASCADE;
  DROP TABLE "_page_tickets_v_version_comparison_tiers" CASCADE;
  DROP TABLE "_page_tickets_v_version_comparison_groups_rows_included" CASCADE;
  DROP TABLE "_page_tickets_v_version_comparison_groups_rows" CASCADE;
  DROP TABLE "_page_tickets_v_version_comparison_groups" CASCADE;
  DROP TABLE "_page_tickets_v_version_categories_items_bullets" CASCADE;
  DROP TABLE "_page_tickets_v_version_categories_items" CASCADE;
  DROP TABLE "_page_tickets_v" CASCADE;
  DROP TABLE "page_contact_board_paragraphs" CASCADE;
  DROP TABLE "page_contact_board_members" CASCADE;
  DROP TABLE "page_contact_reach_out_paragraphs" CASCADE;
  DROP TABLE "page_contact_reach_out_items_details" CASCADE;
  DROP TABLE "page_contact_reach_out_items" CASCADE;
  DROP TABLE "page_contact" CASCADE;
  DROP TABLE "_page_contact_v_version_board_paragraphs" CASCADE;
  DROP TABLE "_page_contact_v_version_board_members" CASCADE;
  DROP TABLE "_page_contact_v_version_reach_out_paragraphs" CASCADE;
  DROP TABLE "_page_contact_v_version_reach_out_items_details" CASCADE;
  DROP TABLE "_page_contact_v_version_reach_out_items" CASCADE;
  DROP TABLE "_page_contact_v" CASCADE;
  DROP TABLE "page_past_teams" CASCADE;
  DROP TABLE "_page_past_teams_v" CASCADE;
  DROP TABLE "site_settings_nav" CASCADE;
  DROP TABLE "site_settings_footer_links" CASCADE;
  DROP TABLE "site_settings_footer_social_links" CASCADE;
  DROP TABLE "site_settings_llms_key_facts" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "_site_settings_v_version_nav" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_links" CASCADE;
  DROP TABLE "_site_settings_v_version_footer_social_links" CASCADE;
  DROP TABLE "_site_settings_v_version_llms_key_facts" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "legal" CASCADE;
  DROP TABLE "_legal_v" CASCADE;
  DROP TYPE "public"."enum_partners_tier";
  DROP TYPE "public"."enum_partners_status";
  DROP TYPE "public"."enum__partners_v_version_tier";
  DROP TYPE "public"."enum__partners_v_version_status";
  DROP TYPE "public"."enum_jobs_workload";
  DROP TYPE "public"."enum_jobs_status";
  DROP TYPE "public"."enum__jobs_v_version_workload";
  DROP TYPE "public"."enum__jobs_v_version_status";
  DROP TYPE "public"."enum_speakers_group";
  DROP TYPE "public"."enum_speakers_status";
  DROP TYPE "public"."enum__speakers_v_version_group";
  DROP TYPE "public"."enum__speakers_v_version_status";
  DROP TYPE "public"."enum_team_division";
  DROP TYPE "public"."enum_team_status";
  DROP TYPE "public"."enum__team_v_version_division";
  DROP TYPE "public"."enum__team_v_version_status";
  DROP TYPE "public"."enum_past_teams_status";
  DROP TYPE "public"."enum__past_teams_v_version_status";
  DROP TYPE "public"."enum_faqs_page";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum__faqs_v_version_page";
  DROP TYPE "public"."enum__faqs_v_version_status";
  DROP TYPE "public"."enum_testimonials_status";
  DROP TYPE "public"."enum__testimonials_v_version_status";
  DROP TYPE "public"."enum_users_divisions";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_page_home_status";
  DROP TYPE "public"."enum__page_home_v_version_status";
  DROP TYPE "public"."enum_page_whyq_status";
  DROP TYPE "public"."enum__page_whyq_v_version_status";
  DROP TYPE "public"."enum_page_speaker_panels_icon_key";
  DROP TYPE "public"."enum_page_speaker_status";
  DROP TYPE "public"."enum__page_speaker_v_version_panels_icon_key";
  DROP TYPE "public"."enum__page_speaker_v_version_status";
  DROP TYPE "public"."enum_page_partner_status";
  DROP TYPE "public"."enum__page_partner_v_version_status";
  DROP TYPE "public"."enum_page_program_status";
  DROP TYPE "public"."enum__page_program_v_version_status";
  DROP TYPE "public"."hackathon_partner_logo_file";
  DROP TYPE "public"."enum_page_hackathon_status";
  DROP TYPE "public"."enum__page_hackathon_v_version_status";
  DROP TYPE "public"."enum_page_our_team_status";
  DROP TYPE "public"."enum__page_our_team_v_version_status";
  DROP TYPE "public"."enum_page_jobs_status";
  DROP TYPE "public"."enum__page_jobs_v_version_status";
  DROP TYPE "public"."enum_page_tickets_status";
  DROP TYPE "public"."enum__page_tickets_v_version_status";
  DROP TYPE "public"."enum_page_contact_status";
  DROP TYPE "public"."enum__page_contact_v_version_status";
  DROP TYPE "public"."enum_page_past_teams_status";
  DROP TYPE "public"."enum__page_past_teams_v_version_status";
  DROP TYPE "public"."enum_site_settings_footer_social_links_platform";
  DROP TYPE "public"."enum_site_settings_status";
  DROP TYPE "public"."enum__site_settings_v_version_footer_social_links_platform";
  DROP TYPE "public"."enum__site_settings_v_version_status";
  DROP TYPE "public"."enum_legal_status";
  DROP TYPE "public"."enum__legal_v_version_status";`)
}
