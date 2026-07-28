# SEO

How search engines and link previews (WhatsApp, LinkedIn) show Q-Summit. When Payload is live, editors change the copy there and the website applies it automatically. Until cutover, ask maintainers: the live site still builds from the content snapshot.

AI assistants (`/llms.txt` identity): see [AI assistants](llms.md).

## Where you edit what

| What people see | Edit in Payload | Notes |
| --- | --- | --- |
| Browser tab title (`Q-Summit \| …`) | Each page → **Title** | Required |
| Google snippet and WhatsApp/LinkedIn text | Each page → **Meta Description** | About 120 to 160 characters. Also used as the one-line note next to that page in `/llms.txt`. |
| Site name in tabs and cards | **Site-wide** → **Navigation, footer & AI identity** → **Site Title** | Usually `Q-Summit` |
| Fallback when a page meta is blank | **Navigation, footer & AI identity** → **Footer** → **Tagline** | Also fills blank AI summary |

Legal pages (Imprint, Privacy, Terms) have no SEO fields; they fall back to the site tagline.

Do **not** invent a second description per page "just for AI."

## What the site exposes automatically

| URL / mechanism | Purpose |
| --- | --- |
| Each page head | Canonical URL, description, Open Graph + large image cards |
| `/robots.txt` | Allows search and AI crawlers; points at the sitemap |
| `/sitemap-index.xml` | Full URL list for search engines |
| `/llms.txt` / `/llms-full.txt` | AI surfaces ([details](llms.md)) |
| Homepage structured data | Organization, website, and next event |

Default share image: `/media/hero-poster.jpg`. Hackathon uses `/media/hack-poster.jpg`. Keep share images wide and under about 300 KB so WhatsApp previews stay reliable.

## Tips for strong WhatsApp and LinkedIn cards

- Write meta descriptions that make sense alone.
- Keep titles short; the site name is added automatically.
- Keep logo and date text near the center of share images (LinkedIn crops widely).
- After a big image change, share the link once more (or change the image address) so chats refresh their cache. LinkedIn: [Post Inspector](https://www.linkedin.com/post-inspector/).
