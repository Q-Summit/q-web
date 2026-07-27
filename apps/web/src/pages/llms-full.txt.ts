import type { APIRoute } from "astro";
import { getPageContent, getSiteSettings } from "../lib/content";
import { buildLlmsFullTxt } from "../lib/llms";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error("astro.config `site` is required for /llms-full.txt");
  }

  const [siteSettings, pageContent] = await Promise.all([
    getSiteSettings(),
    getPageContent(),
  ]);

  return new Response(
    buildLlmsFullTxt({ site: site.href, siteSettings, pageContent }),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
};
