import type { APIRoute } from "astro";
import {
  getHotTopics,
  getPageContent,
  getSiteSettings,
  getSpeakers,
} from "../lib/content";
import { buildLlmsFullTxt } from "../lib/llms";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error("astro.config `site` is required for /llms-full.txt");
  }

  const [siteSettings, pageContent, hotTopics, speakers] = await Promise.all([
    getSiteSettings(),
    getPageContent(),
    getHotTopics(),
    getSpeakers(),
  ]);

  return new Response(
    buildLlmsFullTxt({
      site: site.href,
      siteSettings,
      pageContent,
      hotTopics,
      speakers,
    }),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
};
