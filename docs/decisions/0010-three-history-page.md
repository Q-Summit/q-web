# 0010 · Three.js for the team history on /past-teams

- **Status:** Proposed
- **Date:** 2026-11-25
- **Trigger:** The History page of the team (`/past-teams`, branch `feat/history-story`) was approved as a standalone mockup over more than twenty review rounds. It tells the ten years as a scroll story: a hand-drawn 10, a line that becomes a person deep in thought and a light bulb, whose light becomes a camera's self-timer light; the camera draws itself, turns real while it turns around, and its rear screen becomes the album of every team. DESIGN.md MOTION-4 allows Three.js on the homepage and on `/hackathon` only ([ADR-0008](0008-three-gsap-home-pass.md), [ADR-0009](0009-three-qhack-page.md)) and asks every other page for its own ADR.

## Context

The page replaces the year grid that `/past-teams` showed until now. Its center is a physical object: a camera with satin metal, leatherette, glass that reflects, buttons that can be pressed and a screen that is a live texture. It first appears as line art (its edges drawn by a pen that overshoots the corners, then hatching) and fills in to the real materials from one point, with ambient occlusion in its seams. That needs lit, textured geometry and custom shaders: a renderer, the same conclusion the two earlier ADRs reached. The dependency (`three`) is installed and served first-party. The rest of the story (the 10, the thinker, the bulb, the traveling light) is plain 2D canvas drawing and needs no library. The site's other properties still hold: no cookies, no third-party runtime requests, a page that works without JavaScript, reduced motion respected (MOTION-2), and no file over the per-file asset budget.

## Considered options

1. **No 3D: a drawn camera and a photo slider in CSS.** Pro: no new code path. Con: the approved story turns a drawing into a real object and flies into it; a flat image cannot turn around, and the album would no longer sit on the camera's screen.
2. **Three.js for the camera only, loaded by dynamic import after the page has loaded; the line art stays a first-party 2D canvas.** Pro: the dependency exists; the page's first paint (the team photo hero) never waits for it; the drawing that starts the story costs no library. Con: a third page now depends on Three.js, and the page ships a compressed model and its decoder.
3. **Three.js for everything, the line art as 3D lines.** Pro: one way of drawing. Con: the hand-drawn look (uneven strokes, ghost passes, hatching) is far easier and lighter in 2D, and the story's first frames would wait for the library.

## Decision

Option 2. `components/history/HistoryStory.astro` renders the whole story as HTML (every text from the CMS, every photo as an image) and, once the page has loaded and unless the visitor prefers reduced motion, imports `components/history/history-story.ts` dynamically. That module brings Three.js (the camera, its ambient occlusion through the `GTAOPass` add-on) and the 2D line art (`history-sketch.ts`, `history-lineart.ts`). GSAP is not used: everything follows one scroll value or a timer.

The model is a glTF file compressed with Draco (about 0.5 MB, `public/past-teams/kamera.glb`), decoded by the Draco decoder that ships with `three` (`public/past-teams/draco/`, about 0.25 MB, first-party). Its anchor points (the screen, the buttons, the self-timer light) are a small JSON module next to the code.

What decided it: the approved design is an object that becomes real and is held in the hand, and its needs are met with pieces the site already knows how to ship, scoped to one page.

## Consequences

- DESIGN.md MOTION-4 names `/past-teams` as the third sanctioned place for Three.js, limited to `components/history/`; HISTORY-1 describes the page. One token is added (`--duration-history-wheel`).
- HTML is the base layer. Without JavaScript, with reduced motion and without WebGL the texts stand one after another and the photos form a plain grid; the scroll story only pins once its script runs. Without WebGL the drawn story and the album still run, without the camera.
- Content: the story's texts are the `story` group of the `page-past-teams` global. Until every one of them is filled and published, the page shows the old intro and year grid, so a deploy before the copy is in the CMS changes nothing. The album is the Past Teams list (one photo per board year) plus the current team's hero photo as the newest year.
- Both team routes render both views, as before the story: `/our-team` and `/past-teams` each carry the team grid and the story, and the Current Team / History switch (one switch above both, so it never moves; and the story's button back to the team at its end) swaps them in place without loading a page (`components/team/TeamPanels.astro`). On `/our-team` the story waits hidden: its script is fetched when a visitor heads for the History tab and the story starts the first time the switch shows it, never while hidden.
- Loading and cost: the camera's canvas draws only while the story is on screen and rests when the scroll rests; its drawing buffer is capped at a pixel ratio of 1.6, the ambient occlusion runs at reduced resolution (lower again on touch screens).
- The visual regression gallery shows the page without the script, so its baselines cover the plain layout, not the 3D.
- Revisit if the page's Lighthouse performance on a mid-range phone drops clearly below the other team page, or when a fourth page wants Three.js: then the shared pieces (studio environment, pixel budget, visibility handling) of the homepage, `/hackathon` and `/past-teams` become one building block.
