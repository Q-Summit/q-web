# Editor handbook

How divisions edit [q-summit.com](https://q-summit.com), written for non-developers. Everything here happens in the Payload admin in your browser. You never need GitHub, this repository, or any developer tools.

## The one rule

**Editors propose. Heads and Admins publish.**

| Role | What you do |
| --- | --- |
| **Editor** | Edit content in your division → click **Propose for review**. You never publish. |
| **Head** | Review proposed drafts → **Publish to live site** when approved. You can also propose if you want another Head/Admin to review. |
| **Admin** (IT) | Same publish rights as Heads, plus Users and Legal. Prefer proposing when someone else should check. |

Nothing appears on the live website until a Head or Admin publishes.

## Finding your way in the admin

The left sidebar is grouped so you can match the live website, in the order you are most likely to need them:

| Sidebar group | What it is |
| --- | --- |
| **Website pages** | One entry per public page, listed first because this is where most editing happens. The label shows the URL path (e.g. `Home · /`). Page headlines, intros, and CTAs live here. The preview pane opens automatically so you see your draft on the real layout as you type. |
| **Site-wide** | Navigation, footer, and the short AI identity (`/llms.txt`). Changes here affect every page. |
| **Lists & people** | Repeatable content: Partners, Speakers, Team, Past Teams, Jobs, FAQs, Testimonials. These fill grids and lists _on_ the pages above. |
| **Shared assets** | Media library (upload photos and logos). |
| **System** | Accounts and the legal pages, managed by Admins. |

Rule of thumb: open the **Website page** for the URL you care about; open **Lists & people** when you are adding or editing a person, company, job, or FAQ item.

A page is a stack of collapsible sections, so you can see its shape at a glance and open only the part you are changing. **Search and social** at the bottom of every page holds the browser-tab title and the text shown when someone shares the link.

The dashboard leads with **Website pages**: every page you can edit, its address, and whether it has unpublished changes. Below that sits anything waiting for review (Heads only) and a short **Start here** primer tailored to your role. The left sidebar has a **Shortcuts** group at the top (Dashboard, Review queue / Publish audit for Heads, Media usage, Editor guide).

## Team members

Each person under **Lists & people → Team** carries a name, role, portrait, division, and board year. The **LinkedIn profile** field is optional: paste the full profile address (`https://www.linkedin.com/in/…`) and a small LinkedIn icon appears next to that person's name on `/our-team/`. Leave it empty and no icon shows, so you can fill these in gradually.

It only accepts linkedin.com addresses. A search result, a company page, or a bare handle is rejected when you save, because all three would render a broken link on the live site.

## Images

Upload photos and logos under **Shared assets → Media library**. You can search by file name as well as by description, and the list shows a thumbnail of each file.

Before you change or delete a file, open it and read the **Used on** panel: it lists every partner, speaker, job, team member, and page section that points at it, with a link to each. Replacing the file changes it everywhere in that list. **Shortcuts → Media usage** shows the same thing for the whole library at once, which is the fastest way to spot files nothing uses any more.

Two limits worth knowing:

- The panel checks live entries and pending drafts. An older saved version of a document can still point at a file, so deleting a file that looks unused can still break restoring one of those versions. If in doubt, ask IT.
- If you try to delete a file something still uses, the admin refuses and tells you what is using it. Point those entries at a different file first.

The background videos on the home and hackathon pages are not in the media library: they are far too large for it. Ask IT to replace those.

## Text formatting

Job descriptions and FAQ answers use a formatting toolbar: headings, **bold**, _italic_, bullet and numbered lists, links, quotes, and a dividing line. That is the full set the website can render.

There is deliberately no way to place an image inside this text. Images belong in the entry's own **Logo** or **Photo** field, which is what the website lays out properly and what the Used on panel can track.

## Your account

- Once the editing site is live, you sign in with your `q-summit.com` Google account. There is no separate password: choose "Continue with Google" and pick your work account.
- Your login is personal: one account per person, never shared.
- What you can edit follows your team. Access comes from your team's Google group (see the matrix below). Joining or leaving that group changes your access; nobody sets permissions by hand.
- If sign-in fails, or you are missing something you should be able to edit, or a new member needs access, tell your division's Head, who routes it to the maintainers.

## What each division edits

<!-- Source of truth: the live Payload schema. Maintainers keep this table current per docs/editors/AGENTS.md. -->

| Division | Collections | Page / settings globals |
| --- | --- | --- |
| Partner | Partners, Jobs, Testimonials | Partners and Jobs pages |
| PR | Speakers, Team and Past Teams (with Chair), FAQs (with Concept) | Navigation, footer & AI identity (PR only); Home, Why Q?, Program, Tickets, Contact, Hackathon, Our Team, Past Teams, Speakers (all with Concept) |
| Concept | FAQs (with PR) | Home, Why Q?, Program, Tickets, Contact, Hackathon, Our Team, Past Teams, Speakers (all with PR); not Navigation, footer & AI identity |
| Chair | Team and Past Teams (with PR) | (none alone) |
| Finance / Operations / IT | (no content collections today) | IT admins manage users and Legal |

Media: anyone can upload new files (straight from an image field or via **Media library**). Upload sharp originals up to 5 MB; the site generates the small versions itself, so never upload a pre-shrunk thumbnail. If an existing file needs replacing or deleting, ask an admin.

### Team vs Past Teams

Two separate lists, two different jobs:

- **Team** holds the people currently organizing Q-Summit: one entry per member with name, role, division, photo, the board year, and an optional LinkedIn profile. This fills the division grid on the Our Team page.
- **Past Teams** holds one group photo per finished board year (e.g. `25/26`). This fills the year-by-year history panel.

At board handover (Chair or PR, then a Head publishes):

1. In **Past Teams**, add one entry for the retiring board: its year and the group photo. Never overwrite or delete an older year.
2. In **Team**, replace the members: add the new board's people with the new board year, and remove the retired members.
3. Propose for review as usual; a Head or Admin publishes both.

## Live Preview

On any **Website pages** document, open **Live Preview** (eye icon) in the toolbar. The side panel shows the matching public page. Text fields with live bindings (headlines, intros, many CTAs) update as you type. Lists fed from **Lists & people** (speaker grids, FAQ answers, partner logos) still reflect the last published build until those collection items are published and the site rebuilds.

## Propose → review → publish

1. **Edit.** Change the fields you need. Use Live Preview on Website pages if it helps.
2. **Propose for review.** Click that button (it is Payload's Save Draft, renamed). The live website does **not** change: in lists your item now shows **Draft** (never published) or **Changed** (the live version stays up until review). If a required field is missing or a value is malformed, you get the errors right away; fix them and save again.
3. **Ask a Head.** Ping your division Head (or an Admin) with what you changed. That person is who should publish.
4. **Publish (Heads and Admins only).** They open the same document, use the Review queue's **What changed** link to see the draft side by side with the live version, then click **Publish to live site**. If it is not ready, they tell you what to fix; your next save updates the same draft. Any Head can publish any website draft if yours is away.

### Audit trail

Every page and list item records **who last edited** and **who last published** (email + timestamp) in three places: the document sidebar (fields + History), the **Versions** tab (Edited by / Published by columns), and collection list columns. Heads also get **Shortcuts → Publish audit** for a site-wide table. Open a version row to compare or roll back content.

After Publish (or Unpublish), the public site rebuilds automatically within a few minutes (Workers Builds deploy hook). If it does not, ask a maintainer to run **Rebuild site**.

A failed site build does not replace a working live version.

## When something goes wrong

- You cannot find or edit something you think you should: ask your division's Head first.
- The live site shows something broken (layout, dead link, outdated page that will not update): tell your division's Head, who passes it to the maintainers, or file a bug on GitHub if you have an account there.

## Not live yet

Payload, the editing system, is still being set up. Until cutover, changes you make in an unfinished admin do not reach the live website. Ask your division's Head or maintainers to update SEO or AI identity. The admin login URL and screenshots land here at cutover; the ownership matrix above is already authoritative.

## SEO, sharing, and AI assistants

Guides for after cutover (and for maintainers wiring the interim snapshot today):

- Search snippets and WhatsApp/LinkedIn cards: [SEO](seo.md)
- Short AI index identity (`/llms.txt`): [AI assistants](llms.md)
