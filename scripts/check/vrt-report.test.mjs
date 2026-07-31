import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildReportBanner,
  classifyByTestId,
  collectChanges,
  COMMENT_EXPAND_VARIANT_ROWS,
  escapeInline,
  findOrphanBaselines,
  formatFailureLabel,
  formatTally,
  groupChanges,
  hasReportableChanges,
  isSafeBaselineRel,
  loadDeletedBaselineManifest,
  parseSnapshot,
  regroupReportFilesByComponent,
  renderComment,
  renderManifest,
  reportFilterUrl,
  summarizeBuckets,
} from "./vrt-report.mjs";

// A minimal Playwright JSON report: one changed (has -diff), one added
// (-actual only, no -diff: missing baseline), one render failure (no
// attachments), one clean pass, and one flaky-but-passed (status flaky ->
// not a change).
const report = {
  suites: [
    {
      specs: [
        {
          id: "id-changed",
          title: "home-stats-band--default @ 1280px",
          tests: [
            {
              status: "unexpected",
              results: [
                {
                  attachments: [
                    {
                      name: "home-stats-band--default-1280-expected.png",
                      path: "/e/x.png",
                    },
                    {
                      name: "home-stats-band--default-1280-actual.png",
                      path: "/a/x.png",
                    },
                    {
                      name: "home-stats-band--default-1280-diff.png",
                      path: "/d/x.png",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "id-added",
          title: "ui-button--new @ 390px",
          tests: [
            {
              status: "unexpected",
              results: [
                {
                  attachments: [
                    { name: "ui-button--new-390-actual.png", path: "/a/b.png" },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "id-failed",
          title: "home-hero--default @ 768px",
          tests: [{ status: "unexpected", results: [{ attachments: [] }] }],
        },
        {
          id: "id-ok",
          title: "layout-nav--default @ 1280px",
          tests: [{ status: "expected", results: [] }],
        },
        {
          id: "id-flaky",
          title: "home-faq-accordion--default @ 390px",
          tests: [{ status: "flaky", results: [] }],
        },
      ],
    },
  ],
};

test("collectChanges buckets diff / added / failure and counts total", () => {
  const s = collectChanges(report);
  assert.equal(s.total, 5);
  assert.deepEqual([...s.changed.keys()], ["home-stats-band--default-1280"]);
  assert.deepEqual([...s.added.keys()], ["ui-button--new-390"]);
  assert.deepEqual(s.otherFailures, ["home-hero--default @ 768px"]);
  assert.equal(s.failedById.get("id-failed"), "home-hero--default @ 768px");
});

test("collectChanges keeps distinct render failures under nested describes", () => {
  const r = {
    suites: [
      {
        title: "gallery.spec.ts",
        suites: [
          {
            title: "ui-button",
            specs: [
              {
                id: "fail-a",
                title: "default @ 390px",
                tests: [
                  { status: "unexpected", results: [{ attachments: [] }] },
                ],
              },
            ],
          },
          {
            title: "home-hero",
            specs: [
              {
                id: "fail-b",
                title: "default @ 390px",
                tests: [
                  { status: "unexpected", results: [{ attachments: [] }] },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const s = collectChanges(r);
  assert.deepEqual(s.otherFailures, [
    "home-hero › default @ 390px",
    "ui-button › default @ 390px",
  ]);
  assert.equal(s.failedById.size, 2);
  assert.equal(
    formatFailureLabel(["ui-button"], "default @ 390px"),
    "ui-button › default @ 390px",
  );
  assert.deepEqual([...classifyByTestId(s).entries()].sort(), [
    ["fail-a", "failed"],
    ["fail-b", "failed"],
  ]);
});

test("collectChanges treats actual+expected (no diff) as added too", () => {
  const r = {
    suites: [
      {
        specs: [
          {
            id: "id",
            title: "x",
            tests: [
              {
                status: "unexpected",
                results: [
                  {
                    attachments: [
                      {
                        name: "ui-button--new-390-expected.png",
                        path: "/e.png",
                      },
                      {
                        name: "ui-button--new-390-actual.png",
                        path: "/a.png",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const s = collectChanges(r);
  assert.deepEqual([...s.added.keys()], ["ui-button--new-390"]);
  assert.equal(s.changed.size, 0);
});

test("parseSnapshot splits prefix, variant, and trailing width", () => {
  assert.deepEqual(parseSnapshot("home-stats-band--default-1280"), {
    component: "home-stats-band",
    variant: "default",
    width: "1280",
    name: "home-stats-band--default-1280",
  });
});

test("groupChanges collapses widths of one variant into one row", () => {
  const g = groupChanges([
    "home-stats-band--default-390",
    "home-stats-band--default-1280",
    "home-stats-band--default-768",
  ]);
  assert.equal(g.length, 1);
  assert.equal(g[0].component, "home-stats-band");
  assert.equal(g[0].variants[0].variant, "default");
  assert.deepEqual(
    g[0].variants[0].widths.map((w) => w.width),
    ["390", "768", "1280"],
  );
});

test("hasReportableChanges is true when anything changed/added/removed/failed", () => {
  assert.equal(hasReportableChanges(collectChanges(report)), true);
  assert.equal(
    hasReportableChanges({
      changed: new Map(),
      added: new Map(),
      removed: [],
      otherFailures: [],
    }),
    false,
  );
  assert.equal(
    hasReportableChanges({
      changed: new Map(),
      added: new Map(),
      removed: ["gone--old-390.png"],
      otherFailures: [],
    }),
    true,
  );
});

test("isSafeBaselineRel accepts gallery stems and rejects path tricks", () => {
  assert.equal(isSafeBaselineRel("home-stats-band--default-1280.png"), true);
  assert.equal(isSafeBaselineRel("ui-button--primary-390.png"), true);
  assert.equal(isSafeBaselineRel("../evil-390.png"), false);
  assert.equal(
    isSafeBaselineRel("sub/home-stats-band--default-1280.png"),
    false,
  );
  assert.equal(isSafeBaselineRel("home-stats-band--default-999.png"), false);
  assert.equal(isSafeBaselineRel("HOME--default-1280.png"), false);
  assert.equal(isSafeBaselineRel(""), false);
});

test("findOrphanBaselines returns [] when gallery dir is missing", () => {
  assert.deepEqual(
    findOrphanBaselines(
      "apps/web/tests/visual/__screenshots__",
      "/tmp/definitely-missing-vrt-gallery-dir",
    ),
    [],
  );
});

test("findOrphanBaselines refuses a wipe from a tiny/stale gallery when cautious", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } =
    await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const root = mkdtempSync(join(tmpdir(), "vrt-orphan-"));
  try {
    const baselines = join(root, "shots");
    const gallery = join(root, "gallery");
    mkdirSync(baselines);
    mkdirSync(gallery);
    // 16 baselines on disk, only 1 gallery entry (3 widths expected) ->
    // refuse when cautious (3 < max(3, floor(16*0.25)=4)).
    for (let i = 0; i < 16; i++) {
      writeFileSync(join(baselines, `comp-${i}--x-390.png`), "x");
    }
    mkdirSync(join(gallery, "comp-0--x"));
    assert.deepEqual(
      findOrphanBaselines(baselines, gallery, { cautious: true }),
      [],
    );
    // After a fresh build (--trust-gallery), the same tree reports orphans.
    const orphans = findOrphanBaselines(baselines, gallery, {
      cautious: false,
    });
    assert.equal(orphans.length, 15);
    assert.ok(
      orphans.every((n) => n.startsWith("comp-") && n !== "comp-0--x-390.png"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("WIDTHS shared module matches SAFE_SNAPSHOT_STEM widths", async () => {
  const { WIDTHS, SAFE_SNAPSHOT_STEM } = await import("./vrt-report.mjs");
  assert.deepEqual([...WIDTHS], [390, 768, 1280]);
  for (const w of WIDTHS) {
    assert.equal(SAFE_SNAPSHOT_STEM.test(`ui-button--primary-${w}`), true);
  }
});

test("renderComment: clean run flips to the all-clear", () => {
  const body = renderComment(
    {
      total: 12,
      changed: new Map(),
      added: new Map(),
      removed: [],
      otherFailures: [],
    },
    { ok: true },
  );
  assert.match(body, /<!-- vrt-report -->/);
  assert.match(body, /no changes/);
  assert.match(body, /All 12 snapshots match/);
});

test("summarizeBuckets / formatTally expose added·changed·same·failed", () => {
  const s = collectChanges(report);
  const b = summarizeBuckets(s);
  // 5 specs: 1 changed, 1 added, 1 failed, 1 expected(=same), 1 flaky (not unexpected → same)
  assert.deepEqual(b, {
    total: 5,
    nChanged: 1,
    nAdded: 1,
    nFailed: 1,
    nRemoved: 0,
    nSame: 2,
  });
  assert.equal(formatTally(b), "1 added · 1 changed · 2 same · 1 failed");
  assert.equal(
    formatTally({ ...b, nRemoved: 2 }),
    "1 added · 1 changed · 2 same · 1 failed · 2 removed",
  );
  assert.deepEqual([...classifyByTestId(s).entries()].sort(), [
    ["id-added", "added"],
    ["id-changed", "changed"],
    ["id-failed", "failed"],
  ]);
});

test("reportFilterUrl deep-links Playwright search for a bucket", () => {
  const base = "https://pr-9.q-web-vrt-reports.pages.dev";
  assert.equal(
    reportFilterUrl(`${base}/`, "changed"),
    `${base}/#?q=${encodeURIComponent("[changed]")}`,
  );
  assert.equal(reportFilterUrl("", "added"), "");
});

test("renderComment: changed first, clear copy, no Playwright lecture", () => {
  const body = renderComment(collectChanges(report), {
    ok: true,
    reportUrl: "https://pr-9.q-web-vrt-reports.pages.dev",
    server: "https://github.com",
    repo: "Q-Summit/q-web",
    pr: "9",
  });
  assert.match(body, /1 added · 1 changed · 2 same · 1 failed/);
  assert.match(body, /home-stats-band/);
  assert.match(body, /q-web-vrt-reports\.pages\.dev\/#\?testId=id-changed/);
  assert.match(body, /<summary>1 changed<\/summary>/);
  assert.match(body, /<summary>1 added<\/summary>/);
  assert.match(body, /<summary>1 failed \(render error\)<\/summary>/);
  // Failures deep-link into the hosted report via failedById.
  assert.match(
    body,
    /\[home-hero--default @ 768px\]\(https:\/\/pr-9\.q-web-vrt-reports\.pages\.dev\/#\?testId=id-failed\)/,
  );
  // Changed before added (review priority).
  assert.ok(body.indexOf(">1 changed<") < body.indexOf(">1 added<"));
  assert.ok(!/Playwright labels missing baselines/.test(body));
  assert.match(body, /Open report/);
  assert.ok(
    body.includes(
      reportFilterUrl("https://pr-9.q-web-vrt-reports.pages.dev", "changed"),
    ),
  );
});

test("loadDeletedBaselineManifest reads AUTO prune list", async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "vrt-deleted-"));
  try {
    const file = join(dir, "vrt-deleted-baselines.txt");
    writeFileSync(file, "gone--old-390.png\ngone--old-768.png\n");
    assert.deepEqual(loadDeletedBaselineManifest(file), [
      "gone--old-390.png",
      "gone--old-768.png",
    ]);
    assert.equal(loadDeletedBaselineManifest(join(dir, "missing.txt")), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("renderComment: large added lists compact to components", () => {
  const added = new Map();
  for (let i = 0; i < COMMENT_EXPAND_VARIANT_ROWS + 5; i++) {
    added.set(`comp-${i}--default-390`, { id: `id-${i}`, actual: "/a.png" });
    added.set(`comp-${i}--default-768`, { id: `id-${i}b`, actual: "/a.png" });
  }
  const reportUrl = "https://pr-9.q-web-vrt-reports.pages.dev";
  const body = renderComment(
    {
      total: added.size,
      changed: new Map(),
      added,
      removed: [],
      otherFailures: [],
    },
    {
      ok: true,
      reportUrl,
      committed: true,
    },
  );
  assert.match(body, /Browse in the report/);
  assert.ok(body.includes(reportFilterUrl(reportUrl, "added")));
  assert.match(body, /variant/);
  assert.ok(!/ , /.test(body)); // no weird double-spaced width joins
  assert.match(body, /Baselines are staged/);
});

test("buildReportBanner lists chips, hides PW outcome chips, defaults to changed", () => {
  const html = buildReportBanner({
    baseRef: "main",
    tally: "3 added · 1 changed · 0 same · 0 failed",
    nAdded: 3,
    nChanged: 1,
    nSame: 0,
    nFailed: 0,
  });
  assert.match(html, /id="vrt-summary"/);
  assert.match(html, /Added 3/);
  assert.match(html, /data-vrt-filter="\[added\]"/);
  assert.match(html, /Visual review vs main/);
  assert.match(html, /hidePlaywrightChips/);
  assert.ok(html.includes("q=s%3A") || html.includes('href*="q=s%3A"'));
  assert.match(html, /var DEFAULT = "\[changed\]"/);
  assert.ok(!/Playwright's Passed\/Failed chips still count/.test(html));
});

test("regroupReportFilesByComponent splits gallery.spec.ts by describe path", () => {
  const files = regroupReportFilesByComponent([
    {
      fileId: "gallery-id",
      fileName: "gallery.spec.ts",
      tests: [
        {
          testId: "gallery-id-setup",
          title: "gallery has entries",
          path: [],
          outcome: "expected",
          ok: true,
        },
        {
          testId: "gallery-id-a",
          title: "[changed] default @ 390px",
          path: ["ui-button"],
          outcome: "unexpected",
          ok: false,
        },
        {
          testId: "gallery-id-b",
          title: "[added] default @ 390px",
          path: ["home-hero"],
          outcome: "unexpected",
          ok: false,
        },
        {
          testId: "gallery-id-c",
          title: "[changed] primary @ 768px",
          path: ["ui-button"],
          outcome: "unexpected",
          ok: false,
        },
      ],
      stats: { total: 4 },
    },
  ]);
  assert.deepEqual(
    files.map((f) => f.fileName),
    ["gallery", "home-hero", "ui-button"],
  );
  // testIds stay stable for sticky deep links.
  assert.equal(files[2].tests[0].testId, "gallery-id-a");
  assert.equal(files[2].tests.length, 2);
  // Component describe is the file; path no longer repeats it.
  assert.deepEqual(files[2].tests[0].path, []);
  assert.equal(files[1].fileName, "home-hero");
});

test("renderComment: lists orphan baselines without claiming deletion in COMPARE", () => {
  const body = renderComment(
    {
      total: 3,
      changed: new Map(),
      added: new Map(),
      removed: ["old-comp--gone-390.png", "old-comp--gone-768.png"],
      otherFailures: [],
    },
    { ok: true, committed: false },
  );
  assert.match(body, /orphan/);
  assert.match(body, /will delete on AUTO/);
  assert.match(body, /old-comp/);
});

test("renderComment: unreadable report degrades, never throws", () => {
  const body = renderComment(
    {
      total: 0,
      changed: new Map(),
      added: new Map(),
      removed: [],
      otherFailures: [],
    },
    { ok: false },
  );
  assert.match(body, /report unavailable/);
});

test("collectChanges drops an actual whose base name does not match the diff", () => {
  const r = {
    suites: [
      {
        specs: [
          {
            id: "s",
            title: "t",
            tests: [
              {
                status: "unexpected",
                results: [
                  {
                    attachments: [
                      { name: "foo--v-1280-diff.png", path: "/d.png" },
                      { name: "bar--v-1280-actual.png", path: "/a.png" },
                      { name: "foo--v-1280-expected.png", path: "/e.png" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const s = collectChanges(r);
  assert.deepEqual([...s.changed.keys()], ["foo--v-1280"]);
  // bar's pixels must NOT be adopted as foo's baseline.
  assert.equal(s.changed.get("foo--v-1280").actual, undefined);
  assert.equal(s.changed.get("foo--v-1280").expected, "/e.png");
});

test("escapeInline neutralizes markdown/HTML/structure characters", () => {
  assert.equal(escapeInline("a`b<c>d|e\nf"), "a b c d e f");
  assert.equal(escapeInline("  spaced  "), "spaced");
});

test("renderComment escapes a malicious variant so it cannot inject structure", () => {
  const changed = new Map([
    [
      "evil--x</details>-1280",
      { id: "id-x", diff: "/d.png", actual: "/a.png", expected: "/e.png" },
    ],
  ]);
  const body = renderComment(
    { total: 1, changed, added: new Map(), removed: [], otherFailures: [] },
    { ok: true },
  );
  // The injected closing tag and backtick must be neutralized in the label.
  assert.ok(!/x<\/details>/.test(body));
});

test("renderComment: clean run names the actual base ref, not a hardcoded main", () => {
  const body = renderComment(
    {
      total: 3,
      changed: new Map(),
      added: new Map(),
      removed: [],
      otherFailures: [],
    },
    { ok: true, baseRef: "release/2026" },
  );
  assert.match(body, /match `release\/2026`/);
});

test("renderManifest: trailing newline on every line so read never drops one", () => {
  assert.equal(renderManifest([]), "");
  assert.equal(
    renderManifest(["home-hero--default-1280.png"]),
    "home-hero--default-1280.png\n",
  );
  assert.equal(
    renderManifest(["a-390.png", "b-768.png", "c-1280.png"]),
    "a-390.png\nb-768.png\nc-1280.png\n",
  );
});
