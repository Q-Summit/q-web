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
| **Site-wide** | Navigation, footer, the short AI identity (`/llms.txt`), and the Join Q / Kickoff public-page toggles. Changes here affect every page. |
| **Lists & people** | Repeatable content: Partners, Speakers, Hot topics, Team, Past Teams, Jobs, FAQs, Testimonials. These fill grids and lists _on_ the pages above. |
| **Shared assets** | Media library (upload photos and logos). |
| **System** | Accounts and the legal pages, managed by Admins. |

Rule of thumb: open the **Website page** for the URL you care about; open **Lists & people** when you are adding or editing a person, company, job, or FAQ item.

A page is a stack of collapsible sections, so you can see its shape at a glance and open only the part you are changing. **Search and social** at the bottom of every page holds the browser-tab title and the text shown when someone shares the link.

The dashboard leads with **Website pages**: every page you can edit, its address, and whether it has unpublished changes. Below that sits anything waiting for review (Heads only) and a short **Start here** primer tailored to your role. The left sidebar has a **Shortcuts** group at the top (Dashboard, Review queue / Publish audit for Heads, Media usage, Editor guide).

## Team members

Each person under **Lists & people → Team** carries a name, role, portrait, division, and board year. The **LinkedIn profile** and **Email address** fields are optional: paste the full profile address (`https://www.linkedin.com/in/…`) or the email address, and its icon appears in the small bar that rises over that person's photo on `/our-team/` (on hover, or after a tap on a phone). Leave a field empty and its icon does not show, so you can fill these in gradually. The **Role** is the title shown above the photo: people with exactly the same role stand together under one title, so spell a shared role the same way for everyone who has it.

It only accepts linkedin.com addresses. A search result, a company page, or a bare handle is rejected when you save, because all three would render a broken link on the live site.

The **Email address** field works the same way: enter the person's address (for example `jane.doe@q-summit.com`) and a small mail icon appears beside the LinkedIn icon. Leave it empty and no mail icon shows.

## Images

Upload photos and logos under **Shared assets → Media library**. You can search by file name as well as by description, and the list shows a thumbnail of each file.

Before you change or delete a file, open it and read the **Used on** panel: it lists every partner, speaker, job, team member, and page section that points at it, with a link to each. Replacing the file changes it everywhere in that list. **Shortcuts → Media usage** shows the same thing for the whole library at once, which is the fastest way to spot files nothing uses any more.

Two limits worth knowing:

- The panel checks live entries and pending drafts. An older saved version of a document can still point at a file, so deleting a file that looks unused can still break restoring one of those versions. If in doubt, ask IT.
- If you try to delete a file something still uses, the admin refuses and tells you what is using it. Point those entries at a different file first.

The background video on the home page is not in the media library: it is far too large for it. Ask IT to replace it.

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
| PR | Speakers, Team and Past Teams (with Chair), FAQs and Hot topics (with Concept) | Navigation, footer & AI identity, including Join Q / Kickoff page-on and home-forward toggles (PR only); Home, Why Q?, Program, Tickets, Contact, Hackathon, Our Team, Past Teams, Speakers, Join Q / Kickoff (all with Concept) |
| Concept | FAQs and Hot topics (with PR) | Home, Why Q?, Program, Tickets, Contact, Hackathon, Our Team, Past Teams, Speakers, Join Q / Kickoff (all with PR); not Navigation, footer & AI identity |
| Chair | Team and Past Teams (with PR) | (none alone) |
| Finance / Operations / IT | (no content collections today) | IT admins manage users and Legal |

**Home.** The sections of the Home page follow the page from top to bottom. Under **Hero**, **Badge** holds the edition, the dates and the city, separated by " · " (for example `10 Years of Q-Summit · April 1-2, 2027 · Mannheim`): the homepage shows the edition large above the headline and uses the dates and the city in the header, the menu and the facts under the buttons, so keep all three parts. **Headline** is the big line (its last words turn light blue), **Tagline** the sentence under it, and **CTA** the ticket button (its link always goes to the ticket page). **Lead Lines** and **Announcement Lines** are kept but not shown on the 2027 homepage. **Countdown** holds the wording of a countdown to the **Start Date** under **Conference dates**; the 2027 homepage currently shows no countdown in its hero, so these fields are kept but not shown. Keep `{days}`, `{hours}` and `{minutes}` in **Spoken Label** if you edit them. Under **Partner band**, **Heading** should always name the edition the logos are from. Each row under **Items** is one line of logos: a **Label**, an optional **Description** under it, and the partner names under **Logos** (**Value** is not shown on the new homepage and may stay empty). Under **Why attend**, **Eyebrow** ("Why Q?") is set large, **Heading** stands under it and **Intro** above the list. Each row under **Cards** is one audience in the picker: **Title** is its row, and the card for the picked audience shows **Eyebrow**, **Title**, **Description**, the photo (**Image**, **Image Alt**) and a button to **Href** (for example `/whyq/students`) with **Link Label** as its text. Under **Previous speakers**, **Highlights** lists the past speakers to show, one name per row in the order you want, written exactly as under **Lists & people → Speakers**; leave it empty to show the main stage highlights. **Past Speaker Label** is kept but not shown at the moment: the homepage shows past speakers with their name and role only, without a badge on the picture (do not call them alumni: Q alumni are former team members). The speakers run as one horizontal row that visitors drag or step through, so the number of names does not change the layout; the last words of **Heading** turn light blue. **Lineup** is the next edition: enter its **Label** (the badge on the cards, such as `2027`) and its **Year**, and every published speaker of that year in the group **Current edition speakers** appears, up to the number under **Slots**. **Show Placeholders** is for previews only: it fills open slots with marked placeholder cards so the layout can be checked before speakers are announced. Keep it off for the live site; open slots are then simply not shown. **Stand Ins** lists earlier speakers to show in the lineup's place while no speaker of the lineup year is published yet, one name per row, written exactly as under **Lists & people → Speakers**; **Stand In Label** is kept but not shown at the moment: like past speakers, stand-ins show their name and role only. They disappear on their own as soon as the first speaker of the lineup year is published. **Social** is the LinkedIn and Instagram section. It appears once its **Heading** is filled, and from then on the other texts in the section are required. The two profile links are not set there: they are the LinkedIn and Instagram (Q-Summit) entries under **Site-wide → Navigation, footer & AI identity → Footer → Social Links**. Under **Posts** you add posts, each with its **Platform**, the full address of the post under **Href**, and an **Image**. Always add a new post as the last row: the page shows the newest four, the last row at the far left and each older one a place further right, and the oldest drops out by itself, so you never have to move or delete a row (rows that no longer show may be removed). Without posts the section shows empty frames. **Aftermovie** is the large film block between the audiences and the partners: it appears once its **Heading** is filled (for example "Feel the energy."), with **Eyebrow** as the small label at the top left (for example "Aftermovie 2026"); the film itself is the one the homepage has always used. A click on the film and the small "More on YouTube" link at the top right open the YouTube entry under **Site-wide → Navigation, footer & AI identity → Footer → Social Links**; without that entry the film is not a link. The two lines of large words that run across the film while visitors scroll are part of the design, not editable here. Right before the speakers the homepage shows Mannheim Palace as a drawing (always drawn in full) whose windows light up while visitors scroll, with a count that climbs to the **Participants** figure under **Stats** and five programme items that show one at a time while visitors scroll (a click on one of the small bars under them jumps to that item). The heading "Two days inside a palace" takes its number of days from the **Conference dates**; the heading's other words and the programme items are part of the design and have no fields of their own. The discount phases on the homepage (four cards, the same as at the top of the ticket page) come from the ticket page (**Ticket categories → Phases**), so they are edited in one place. Give the phase on sale an **Ends at** there, and the homepage shows the day it ends and counts down to it; without it there is no countdown. Nothing switches by itself when the time is up: set **Current phase** to the next phase. Between two phases (the last one sold out, the next not open yet), set **Current phase** to the coming one and switch **On sale** off: the homepage then says "Christmas Sale is coming." (with the phase's own name) instead of a countdown, the hero's facts say "25% off coming soon", and the card of that phase carries **Next Label** ("Next up"). **FAQ teaser** is kept, but it is currently not shown on the homepage.

**Why Q?** The four audience pages (Students, Startups, Corporates, Investors) get their content from the rows under **Website pages → Why Q? → Audience pages**, one row each, picked with **Audience**. A row holds the page from top to bottom: hero, figures (keep the same figure in the same place on every page, for example the participants first), the activities with their photos, the highlight, the cards beside the ticket and the questions. The highlight's **Layout** decides what it shows: two photo cards, last year's winner, a logo wall, or the Qube photo with logos. A logo wall shows 2, 3 or 4 logos per row depending on the screen, so give it 12 logos (or 24) to fill every row. For a logo, pick the file the Partners list already uses; a logo that is not there yet is uploaded once to the media library. Tickets and prices come from **Tickets**: a row only names its tickets, and an answer that quotes a price writes `{price:student}` or `{regular:student}` (with the ticket's key) so the price is always current. A page whose row is missing is left out of the site.

**Navigation sub-items.** Under **Site-wide → Navigation, footer & AI identity → Nav**, each item can carry **Sub-items**: links shown in a menu under that item, such as the audience pages under Why Q?. A sub-item has a **Label** and an **Href**, like the item itself. Leave **Sub-items** empty for a plain link. An item with sub-items is no link of its own: clicking it opens the menu, and its own **Href** is not used. Why Q? works this way: it has no overview page, only its four audience pages (Students, Startups, Corporates, Investors), and the old address `/whyq/` leads to the audience tiles on the homepage. The texts and photos of those four pages come from **Pages → Why Q?**, one **Audiences** section each.

**Partners.** The Partners page has three parts, and the page sections follow them. **Partner logos** is the dark opening with all partner logos, a bar of the tier names and a heading per tier: **Eyebrow**, the small label over the heading (for example "Our partners 2026"), its **Heading** (while it is empty, the page title stands in), an optional **Intro**, an optional **Hint**, the small note above the logos (for example "Pick a logo to learn more"), **Tier Suffix**, the word after the tier name in every tier heading ("Partners" turns Gold into "Gold Partners"; empty shows the tier name alone), and **Website Label**, the button in the pop-up that opens the partner's website (for example "Visit website"; empty shows the website's address). The logos themselves come from **Lists & people → Partners**: each partner appears under its tier, in the order of that list. The page is dark, so it shows every **Logo** in white and light blue, toned automatically, and a white ground or a colored box around the logo falls away; a round badge beside the name stays white with its symbol cut out. Pointing at a logo shows the regular logo on a white card. If the automatic version of a logo looks wrong (for example a logo with a detailed picture inside), upload the partner's official white logo as **Logo for dark backgrounds**; the page then shows that file as it is. The pop-up always shows the regular logo in its own colors. Picking a partner opens a pop-up with its regular logo, its **Description** and a button to its website; the description is optional (two or three sentences on what the company does and what it offers at Q-Summit), and without one the pop-up shows the logo and the button only. **Heading** (on its own, below the logos) is the title of the section with the partner photos and quotes, and **Quotes Hint** the short line under it that tells visitors to tap the quote mark on a photo to read the quote (for example "Tap the quote mark on a photo to read what they said."; empty shows no line); the photos and quotes come from **Lists & people → Testimonials**, and a quote without a photo shows the person's initials. **Become a Partner** closes the page: its **Heading** and **Text**, optional **Points** (short lines on what a partner gets), the main button (**Button Label** and **Button Href**, the address of the partner form or a mailto: address), and the **Contact person** companies talk to: **Name**, an optional **Role**, **Email**, **Email Label** (the button that opens a new email to that address, for example "Write email"; empty shows the address itself), **Copy Label** (the hint of the small copy icon next to it, for example "Copy address"; empty hides the icon), **Copied Label** (what that hint says for a moment after copying, for example "Copied") and an optional **Portrait**. The card appears once name and email are filled. **Startup, Corporate and Investor pages** has one block per audience: **Label**, **Summary** and **Link Label** make up its link card under Become a Partner, and the rest fills the page it leads to (`/partner/startup/`, `/partner/corporate/` or `/partner/investor/`): its **Heading** and **Intro** (also used as the search snippet of that page), the benefit cards under **Benefits**, and the people to write to under **Contacts**, each with **Name**, an optional **Role**, an **Email** and an optional **Portrait**. **Contact Label** is the email button on every contact card; keep names out of it. An audience whose **Label** is still empty is left out, with its link and its page; once the **Label** is filled, every other text in its block is required, and the link and the page appear.

**Speakers.** The speakers page has four parts, top to bottom. **Hot topics** (under **Lists & people → Hot topics**) are the topics of the next edition, shown one at a time on a white card: each has a **Keyword** (one word in capitals, set very large; each topic needs a different one), a **Title**, the **Field** (the industries it covers), a **Description** of two to three sentences (about 250 characters), the **Image** (the sphere: a square picture with a transparent background) and, optionally, a **Thumb**, a square close-up cropped to the ball without anything around it, which fills the small round button (leave it empty to use a zoomed-in sphere). **Order** sets the sequence. The texts above the card are under **Website pages → Speakers → Hot topics**: **Label** (the small line in capitals), **Heading** and **Intro**; leave a field empty to keep the standard wording ("Hot topics 2027", "Three topics set the 2027 main stage", "The 2027 line-up is announced step by step."). Under it, **Heading** and **Intro** of **Website pages → Speakers** stand over the stage. Until the 2027 line-up is out, the stage shows the same speakers as the homepage, in the same order: the speaker highlights, then the line-up stand-ins (both set on **Website pages → Home**); once the line-up is out, a developer switches it to the speakers of the edition. Each stands on the three screens of the real main stage: name and role (**Role** and **Company**, shown as "Role · Company") on the left, a picture in the middle, and under **Talk** the **Talk title** and a **Quote** on the right. The picture is **Stage photo** under **Talk**: the screen-look picture made from the stage photo, 1057 × 754 px, with the speaker already on the screen, which lies exactly over the stage. Without it the stage fits the speaker's **Photo** into the screen, and without either a silhouette shows. **Stage photo** is only used on the speakers page, so the homepage keeps showing the **Photo**. Keep talk titles under about 45 characters so they fit on phones, and write the quote without quotation marks. **Lineup Pill** is the small pill under the stage (standard: "Line-up 2027 · Coming soon"). **Panels** on the Speakers page are kept but not shown at the moment.

**Tickets.** One list feeds the whole ticket page: the ticket picker under **What's included** (the list of tickets on the left, the card of the ticket picked on the right) and **Compare tickets** read the same tickets and benefits, so you change a price or a benefit once. Under **Tickets**, **Ticket shop link** is the one address every buy button opens. Each ticket has a **Key** (which category it is), its name and description, the **Regular price** and the current **Price** in whole euros (the site works out "Save €…" itself), up to five highlights (kept, but not shown at the moment), and an optional **Requirement** such as "Valid student ID required", shown on the ticket card. Under **What's included**, each group is either **Benefits** (shown as Included / Not included) or **Requirements** (Required / Not required, never counted as a benefit). On each row, tick the tickets it applies to. Keep `{ticket}`, `{included}` and `{total}` in the buy button and count labels; the site fills them in (the count is not shown on the page at the moment). **Discount phases** are the four cards at the top of the page (and in the homepage's sale section): add the phases in order, each with a **Key** (a short id such as `early-bird`), the shown name and the **Discount** in whole percent, then enter the key of the phase selling now under **Current phase** and leave **On sale** ticked. Earlier phases show as over and later ones as coming; nothing switches by date, so change **Current phase** when the shop moves on. Between two phases, enter the coming phase under **Current phase** and switch **On sale** off: the page then opens with "… Sale is coming." and "See ticket options" instead of its heading, that phase's card is tagged with **Next Label** ("Next up"), and every ticket (here and on the Why Q pages) shows only its **Regular price**, without a struck price or a saving, whatever is still entered under **Price**. When the phase opens, enter its prices under **Price** and switch **On sale** on again. Keep `{discount}` in the discount label. The card of the phase on sale leads to the ticket picker. Leave **Discount phases** empty to show the small label from **Header** instead. The **2026 archive** section at the bottom is read-only and no longer shown on the site.

**Join Q / Kickoff.** Heads publish the Join Q / Kickoff Website page. Two toggles under **Site-wide → Navigation, footer & AI identity → Join Q / Kickoff** (PR only) control whether `/kickoff/` is public and whether `/` forwards there. On each speaker row, **Portrait crop** sets how the photo sits in the card. The **Register label** under Small UI labels is the small badge on the location card; leave it empty to hide the badge. **Register URL** turns that badge into an outbound signup link. Leave the URL empty to keep a non-clickable label. Do not paste an embed snippet. On each quiz **Team result**, **Team page URL** is that team's Notion page. Use the quiz team names (Corporate, Startup & Venture Capital, Speaker, Growth & Partnerships) so the result cards actually link. Under **Application flow**, paste the Typeform address into **Application URL**. That same address is what the quiz **Apply** button and the **Ready for Q** button (directly under the hero, above the kickoff panel) open (in a new tab), even while the label still says Coming Soon. Tick **Applications open** to switch those buttons to Apply now. Leave the URL empty to keep them on-page. Do not paste an embed snippet there either.

Media: anyone can upload new files (straight from an image field or via **Media library**). Upload sharp originals up to 5 MB; the site generates the small versions itself, so never upload a pre-shrunk thumbnail. If an existing file needs replacing or deleting, ask an admin.

### Team vs Past Teams

Two separate lists, two different jobs:

- **Team** holds the people currently organizing Q-Summit: one entry per member with name, role, division, photo, the board year, and an optional LinkedIn profile. This fills the division grid on the Our Team page.
- **Past Teams** holds one group photo per finished board year (e.g. `25/26`). These photos fill the photo album on the History page.

The pages around them are set under **Website pages**. **Our Team** holds the heading and the group photo at the top of both team pages (**Hero Image**: upload it in three widths with the same name ending in `-p-1280`, `-p-1920` and `-p-2560` and pick the 2560 one, so every screen loads only the size it needs), the **Current Team** label of the switch, and the heading above each division (**Division Heading**, `{division}` stands for the name). **Past Teams** holds the **Heading** on the photo at the top, the **History** label, the description of each album photo for screen readers (**Photo Alt**, `{year}` stands for the year) and the **Story** section. An empty label or description shows the current wording.

**The History story.** Below the photo, the History page tells a scroll story: a drawn line turns into a camera, and the camera's screen becomes a photo album of every team. The album shows one photo per year from the **Past Teams** list, plus the current team's photo from **Our Team → Hero Image**. All of the story's words live in **Website pages → Past Teams → Story**:

| Field | What it shows |
| --- | --- |
| **Hero Eyebrow**, **Hero Heading**, **Hero Lead** | The small line, the heading and the paragraph that open the story |
| **Cue Label** | The button under that paragraph that glides through the first part of the story |
| **Origin Eyebrow**, **Origin Heading**, **Origin Sub**, **Origin Text** | The part about how Q-Summit began: small line, heading, short line under it, paragraph |
| **Teams Eyebrow**, **Teams Heading**, **Teams Text** | The part about the teams over the years |
| **Album Eyebrow**, **Album Heading** | The small line and the heading of the photo album |
| **Album Hint**, **Album Hint Touch** | The hint under the camera on how to flip through the photos, on a computer and on a phone |
| **Back Label** | The button under the camera that scrolls back to the start |
| **Closing Eyebrow**, **Closing Heading**, **Closing Text** | The closing part at the end of the page |
| **Closing Button Label** | The button at the end; it always leads to the Our Team page |

Fill in every Story field. Until all of them are filled and published, the History page keeps its older layout: the **Intro** under the heading and one photo per year, each with the **Year Heading** above it (`{year}` stands for the year). Once the whole story is published, **Intro** and **Year Heading** are no longer shown.

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
