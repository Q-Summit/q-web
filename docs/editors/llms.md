# AI assistants (/llms.txt)

How ChatGPT, Claude, and similar tools learn what Q-Summit is. When Payload is live, edit under **Site-wide** → **Navigation, footer & AI identity** → **AI assistants (/llms.txt)**. Until cutover, ask maintainers: the live site still builds from the content snapshot, not from Payload. You never edit a file named `llms.txt` yourself.

For Google snippets and WhatsApp cards, see [SEO](seo.md).

## Fields

| Field | What to write |
| --- | --- |
| **Summary** | One or two factual sentences (who / what / where). Encyclopedia tone, not an ad. Blank → footer tagline. |
| **Pitch** | One short value line (who benefits and why). Blank → home hero tagline. |
| **Key Facts** | One fact per row (`What:`, `Where:`, `When:`, `Scale:`, `Audience:`, `Value:`, `Contact:`). No leading dash. About 6 to 10 rows. Blank → no Key facts block (do not invent rows). |
| **Last Reviewed** | Date you last checked the facts (`YYYY-MM-DD`). Blank → omitted from `/llms.txt`. |

**Site Title** (top of the same **Navigation, footer & AI identity** screen) is the `/llms.txt` heading.

Page **Meta Description** still owns each page's one-line link note. Main page sections feed `/llms-full.txt` automatically (not every nested CMS block).

## When to update

Update these fields when dates, scale numbers, legal/contact details, audience, or the one-line value story change. Skip for typo or photo-only page edits.

After a Head or Admin publishes, the site rebuilds via the Workers Builds deploy hook (usually within a few minutes). Spot-check `https://q-summit.com/llms.txt` and `/llms-full.txt`. If something looks wrong, tell your division's Head. If a publish did not appear, ask a maintainer to run **Rebuild site**.
