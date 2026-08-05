#!/usr/bin/env node
/**
 * Smoke + unit tests for root scripts (node:test).
 * Wired into `pnpm run check:fast` / `check:scripts`.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { argValue, hasFlag, parseList } from "../lib/args.mjs";
import {
  hostnameOf,
  isLocalHostname,
  isUnsetEnvValue,
  parseEnvFile,
  resolveEnvValue,
  upsertEnvFile,
} from "../lib/env.mjs";
import {
  CMS_DIR,
  CMS_ENV,
  CMS_ENV_REMOTE,
  CMS_ENV_VERCEL,
  isNestedCheckout,
  REPO_ROOT,
  WEB_DIR,
} from "../lib/paths.mjs";
import {
  runCommand,
  runCommandSync,
  runPnpmScriptsParallel,
} from "../lib/run.mjs";
import {
  DEFAULT_PACKAGE_DIR,
  SYNC_COLLECTIONS,
  SYNC_DENY,
  SYNC_GLOBALS,
} from "../content/sync-scope.mjs";

const root = REPO_ROOT;
const node = process.execPath;

function runScript(relPath, args = [], env = {}) {
  return spawnSync(node, [path.join(root, relPath), ...args], {
    cwd: root,
    encoding: "utf-8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

describe("scripts/lib/paths", () => {
  it("points at the monorepo root and app dirs", () => {
    assert.equal(path.basename(REPO_ROOT), "q-web");
    assert.ok(fs.existsSync(path.join(REPO_ROOT, "package.json")));
    assert.equal(CMS_DIR, path.join(REPO_ROOT, "apps/cms"));
    assert.equal(WEB_DIR, path.join(REPO_ROOT, "apps/web"));
    assert.equal(CMS_ENV, path.join(CMS_DIR, ".env"));
    assert.equal(CMS_ENV_REMOTE, path.join(CMS_DIR, ".env.remote"));
    assert.equal(CMS_ENV_VERCEL, path.join(CMS_DIR, ".env.vercel"));
  });

  it("isNestedCheckout spots a separate checkout but never this repo", (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qweb-nested-"));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    assert.equal(isNestedCheckout(dir), false, "plain dir is not a checkout");

    // `git worktree add` writes .git as a FILE pointing at the real gitdir;
    // `git clone` writes it as a directory. Both mark a separate checkout, so
    // an isDirectory() test here would miss every agent worktree.
    fs.writeFileSync(path.join(dir, ".git"), "gitdir: /elsewhere\n");
    assert.equal(isNestedCheckout(dir), true, "worktree .git file counts");

    fs.rmSync(path.join(dir, ".git"));
    fs.mkdirSync(path.join(dir, ".git"));
    assert.equal(isNestedCheckout(dir), true, "clone .git dir counts");

    // REPO_ROOT carries a .git of its own, so an unguarded existsSync would
    // call the tree we are actually gating foreign and skip the entire repo.
    assert.equal(isNestedCheckout(REPO_ROOT), false, "never the repo itself");
  });
});

describe("root gates skip nested checkouts", () => {
  /**
   * Plant a fake agent worktree inside the repo: a `.git` file (what `git
   * worktree add` writes) plus one .ts file that trips BOTH root gates, the
   * em-dash scan in check:docs and the stale-doc citation scan in check:design.
   *
   * The extension matters. A .ts file is invisible to the other check:fast
   * members that run concurrently (prettier only checks md/json/yaml/mjs,
   * markdownlint only .md), so planting it cannot make a sibling check fail
   * and turn this into a flake.
   */
  function plantWorktree(t) {
    const dir = fs.mkdtempSync(
      path.join(root, ".claude", "worktrees", "probe-"),
    );
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.writeFileSync(path.join(dir, ".git"), "gitdir: /elsewhere\n");
    // Both violations are assembled from escapes / concatenation so that THIS
    // file stays clean under the very scans it is exercising, the same reason
    // docs.mjs writes its own dash pattern as \u escapes.
    const emDash = "\u2014";
    const staleDoc = "STYLE" + ".md";
    fs.writeFileSync(
      path.join(dir, "probe.ts"),
      `export const probe = "a${emDash}b"; // see ${staleDoc}\n`,
    );
    return path.basename(dir);
  }

  // Both gates key every exemption on a repo-relative path (the CI content
  // fixture, LICENSE.md, design.mjs exempting itself). Inside a nested
  // checkout those paths sit one prefix deeper and match none of them, so
  // without the skip the gate fails on another branch's files.
  for (const script of ["scripts/check/docs.mjs", "scripts/check/design.mjs"]) {
    it(`${script} ignores a planted worktree`, (t) => {
      const name = plantWorktree(t);
      const r = runScript(script);
      const output = `${r.stdout}${r.stderr}`;
      assert.ok(
        !output.includes(name),
        `${script} reported on the nested checkout:\n${output}`,
      );
      assert.equal(r.status, 0, output);
    });
  }
});

describe("repo hygiene", () => {
  it("gitignores agent worktrees from .gitignore, not a local exclude", () => {
    // EnterWorktree puts a second checkout of this repo under
    // .claude/worktrees/. A machine that has one must not see it as untracked,
    // and the rule has to ship in the committed .gitignore: a
    // .git/info/exclude entry is per-machine, so it silently covers whoever
    // set it up and nobody else (including CI).
    const r = spawnSync(
      "git",
      ["check-ignore", "-v", ".claude/worktrees/probe/README.md"],
      { cwd: root, encoding: "utf-8" },
    );
    assert.equal(r.status, 0, "expected .claude/worktrees/ to be ignored");
    assert.match(
      r.stdout,
      /^\.gitignore:/,
      `expected .gitignore to own the rule, got: ${r.stdout.trim()}`,
    );
  });
});

describe("scripts/lib/args", () => {
  it("reads flag values and ignores -- separators", () => {
    const argv = ["node", "x", "--", "--collections", "faqs", "--dry-run"];
    assert.equal(argValue("--collections", argv), "faqs");
    assert.equal(hasFlag("--dry-run", argv), true);
    assert.equal(hasFlag("--local", argv), false);
  });

  it("parseList handles omitted, all, and csv", () => {
    assert.deepEqual(parseList(undefined, ["a", "b"]), ["a", "b"]);
    assert.deepEqual(parseList("all", ["a"], ["a", "b", "c"]), ["a", "b", "c"]);
    assert.deepEqual(parseList("faqs, partners", ["x"]), ["faqs", "partners"]);
  });
});

describe("scripts/lib/env", () => {
  it("hostnameOf and isLocalHostname cover local + Neon shapes", () => {
    assert.equal(hostnameOf("postgres://u:p@localhost:5433/qweb"), "localhost");
    assert.equal(hostnameOf("postgresql://u:p@127.0.0.1/qweb"), "127.0.0.1");
    assert.equal(isLocalHostname("localhost"), true);
    assert.equal(isLocalHostname("127.0.0.1"), true);
    assert.equal(isLocalHostname("[::1]"), true);
    assert.equal(isLocalHostname("ep-x.eu-central-1.aws.neon.tech"), false);
    assert.equal(hostnameOf(""), null);
    assert.equal(hostnameOf("not-a-uri"), null);
  });

  it("parseEnvFile reads KEY=VALUE and skips comments", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qweb-env-"));
    const file = path.join(dir, ".env");
    fs.writeFileSync(
      file,
      ["# comment", "FOO=bar", 'QUOTED="hi there"', "EMPTY=", "BARE"].join(
        "\n",
      ),
    );
    const parsed = parseEnvFile(file);
    assert.equal(parsed.FOO, "bar");
    assert.equal(parsed.QUOTED, "hi there");
    assert.equal(parsed.EMPTY, "");
    assert.equal(parsed.BARE, undefined);
    assert.deepEqual(parseEnvFile(path.join(dir, "missing")), {});
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("isUnsetEnvValue treats blanks and placeholders as unset", () => {
    assert.equal(isUnsetEnvValue(""), true);
    assert.equal(isUnsetEnvValue("CHANGEME"), true);
    assert.equal(isUnsetEnvValue("REPLACE_WITH_VERCEL_APP_URL"), true);
    assert.equal(isUnsetEnvValue("https://YOUR_CMS.vercel.app"), true);
    assert.equal(isUnsetEnvValue("same-as-vercel-CONTENT_SYNC_TOKEN"), true);
    assert.equal(isUnsetEnvValue("https://cms.example.test"), false);
    assert.equal(isUnsetEnvValue("lukas.strickler@q-summit.com"), false);
  });

  it("resolveEnvValue skips placeholders and upsertEnvFile preserves comments", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qweb-env-"));
    const file = path.join(dir, ".env");
    fs.writeFileSync(
      file,
      [
        "# keep me",
        "REMOTE_CMS_URL=https://YOUR_CMS.vercel.app",
        "OTHER=1",
      ].join("\n") + "\n",
    );
    assert.equal(resolveEnvValue("REMOTE_CMS_URL", parseEnvFile(file)), "");
    upsertEnvFile(file, {
      REMOTE_CMS_URL: "https://cms.example.test",
      REMOTE_S3_ACCESS_KEY_ID: "akid",
    });
    const next = parseEnvFile(file);
    assert.equal(next.REMOTE_CMS_URL, "https://cms.example.test");
    assert.equal(next.REMOTE_S3_ACCESS_KEY_ID, "akid");
    assert.equal(next.OTHER, "1");
    assert.match(fs.readFileSync(file, "utf-8"), /# keep me/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("scripts/lib/run", () => {
  it("runCommandSync returns 0 for a successful node -e", () => {
    assert.equal(runCommandSync(node, ["-e", "process.exit(0)"]), 0);
  });

  it("runCommand resolves non-zero on failure", async () => {
    assert.equal(
      await runCommand(node, ["-e", "process.exit(7)"], { label: "test" }),
      7,
    );
  });

  it("runPnpmScriptsParallel refuses empty input", async () => {
    assert.equal(await runPnpmScriptsParallel([]), 1);
  });
});

describe("scripts/content/sync-scope", () => {
  it("keeps deny list and package dir stable", () => {
    assert.deepEqual(SYNC_DENY, ["users", "legal"]);
    assert.equal(DEFAULT_PACKAGE_DIR, "scripts/content-packages/current");
    assert.ok(SYNC_COLLECTIONS.includes("faqs"));
    assert.ok(SYNC_GLOBALS.includes("site-settings"));
    assert.ok(!SYNC_COLLECTIONS.includes("users"));
  });
});

describe("package.json script entrypoints exist", () => {
  it("every node scripts/… path in package.json resolves", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf-8"),
    );
    const missing = [];
    for (const [name, cmd] of Object.entries(pkg.scripts)) {
      for (const match of cmd.matchAll(/node (scripts\/[^\s]+)/g)) {
        const file = match[1];
        if (!fs.existsSync(path.join(root, file)))
          missing.push(`${name} -> ${file}`);
      }
    }
    assert.deepEqual(missing, []);
  });
});

describe("CLI fail-closed smoke", () => {
  it("assert-db accepts local DATABASE_URI", () => {
    const r = runScript("scripts/local/assert-db.mjs", [], {
      DATABASE_URI: "postgresql://postgres:localdev@localhost:5433/qweb",
    });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /assert-local-db: OK/);
  });

  it("assert-db refuses a remote/Neon DATABASE_URI", () => {
    const r = runScript("scripts/local/assert-db.mjs", [], {
      DATABASE_URI: "postgres://u:p@ep-x.eu-central-1.aws.neon.tech/qweb",
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /REFUSING|neon\.tech/i);
  });

  it("content:pull denies SYNC_DENY collections before network", () => {
    const r = runScript(
      "scripts/content/pull.mjs",
      ["--collections", "users"],
      { REMOTE_CMS_URL: "https://cms.example.test" },
    );
    assert.notEqual(r.status, 0);
    assert.match(`${r.stderr}${r.stdout}`, /denied|SYNC_DENY|users/i);
  });

  it("content:pull refuses placeholder REMOTE_CMS_URL", () => {
    const r = runScript("scripts/content/pull.mjs", [], {
      REMOTE_CMS_URL: "https://REPLACE_WITH_VERCEL_APP_URL",
    });
    assert.notEqual(r.status, 0);
    assert.match(
      `${r.stderr}${r.stdout}`,
      /missing or placeholder|REMOTE_CMS_URL/i,
    );
  });

  it("ops:mirror-media refuses empty REMOTE_S3_* before TTY", () => {
    const r = runScript("scripts/ops/mirror-media.mjs", [], {
      REMOTE_S3_BUCKET: "",
      REMOTE_S3_ENDPOINT: "",
      REMOTE_S3_ACCESS_KEY_ID: "CHANGEME",
      REMOTE_S3_SECRET_ACCESS_KEY: "CHANGEME",
    });
    assert.notEqual(r.status, 0);
    assert.match(
      `${r.stderr}${r.stdout}`,
      /missing or placeholder|REMOTE_S3_/i,
    );
  });

  it("content:propose refuses missing bundle", () => {
    const r = runScript(
      "scripts/content/propose.mjs",
      ["--local", "--dir", "scripts/content-packages/__missing__"],
      {
        CONTENT_SYNC_TOKEN: "x",
        CONTENT_SYNC_USER_EMAIL: "lukas",
        CMS_SERVER_URL: "http://localhost:3000",
      },
    );
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /missing|bundle\.json/i);
  });

  it("content:propose refuses example actor dev before network", () => {
    const r = runScript(
      "scripts/content/propose.mjs",
      ["--local", "--dir", "scripts/content-packages/__missing__"],
      {
        CONTENT_SYNC_TOKEN: "x",
        CONTENT_SYNC_USER_EMAIL: "dev@q-summit.com",
        CMS_SERVER_URL: "http://localhost:3000",
      },
    );
    assert.notEqual(r.status, 0);
    assert.match(`${r.stderr}${r.stdout}`, /example value "dev"/i);
  });

  it("content:propose refuses non-Workspace actor domain before network", () => {
    const r = runScript(
      "scripts/content/propose.mjs",
      ["--local", "--dir", "scripts/content-packages/__missing__"],
      {
        CONTENT_SYNC_TOKEN: "x",
        CONTENT_SYNC_USER_EMAIL: "someone@gmail.com",
        CMS_SERVER_URL: "http://localhost:3000",
      },
    );
    assert.notEqual(r.status, 0);
    assert.match(`${r.stderr}${r.stdout}`, /@q-summit\.com/i);
  });

  it("ops:cms-remote refuses without usable remote env or TTY", () => {
    const r = runScript("scripts/ops/cms-remote.mjs");
    assert.notEqual(r.status, 0);
  });

  it("ops:mirror-db refuses without REMOTE_DATABASE_URI or TTY", () => {
    const r = runScript("scripts/ops/mirror-db.mjs");
    assert.notEqual(r.status, 0);
    assert.match(
      `${r.stderr}${r.stdout}`,
      /ops:mirror-db|REMOTE_DATABASE_URI|TTY/i,
    );
  });

  // The gate is only as good as its tag list. It shipped missing [partner] and
  // [whyq], so it reported "0 content warnings" over a build that had just
  // dropped nine partner logos. Derive the truth from the source instead of
  // trusting the list: every tag apps/web actually emits from a console.warn /
  // console.info must be matched by WARNING_TAG.
  it("build-web WARNING_TAG covers every warning tag apps/web emits", async () => {
    const { WARNING_TAG } = await import("./build-web.mjs");

    const files = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(abs);
        else if (/\.(astro|ts|mjs)$/.test(entry.name)) files.push(abs);
      }
    };
    // Everything that can print during a web build, not just src/: the worker
    // and the build-time scripts emit into the same stream the gate scans.
    for (const dir of ["apps/web/src", "apps/web/worker", "apps/web/scripts"]) {
      walk(path.join(REPO_ROOT, dir));
    }

    const emitted = new Set();
    for (const file of files) {
      const text = fs.readFileSync(file, "utf-8");
      // A console.warn/info whose message begins with a [tag], allowing the
      // message to sit on a following line (prettier wraps these).
      for (const m of text.matchAll(
        /console\.(?:warn|info)\(\s*(?:`|"|')?\s*\[([a-z][a-z:-]*)\]/g,
      )) {
        emitted.add(m[1]);
      }
    }

    assert.ok(emitted.size > 0, "found no tagged warnings to check");
    const uncovered = [...emitted].filter(
      (tag) => !WARNING_TAG.test(`[${tag}]`),
    );
    assert.deepEqual(
      uncovered,
      [],
      `these warning tags are emitted by apps/web but not matched by WARNING_TAG in ` +
        `scripts/check/build-web.mjs, so the fixture gate would not see them: ${uncovered.join(", ")}`,
    );
  });

  it("reset:local refuses non-TTY", () => {
    const r = runScript("scripts/local/reset.mjs");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /not a TTY|interactive-only/);
  });

  it("run-parallel CLI requires script names", () => {
    const r = runScript("scripts/check/run-parallel.mjs");
    assert.equal(r.status, 1);
  });
});

describe("check/budgets", () => {
  const makeDist = () => fs.mkdtempSync(path.join(os.tmpdir(), "qweb-dist-"));

  it("refuses a missing dist with a build-first message", () => {
    const r = runScript("scripts/check/budgets.mjs", [
      "--dist",
      path.join(os.tmpdir(), "qweb-dist-__missing__"),
    ]);
    assert.equal(r.status, 1);
    assert.match(`${r.stderr}${r.stdout}`, /no build|build.*first/i);
  });

  it("flags an oversized shipped asset by name", () => {
    const dir = makeDist();
    fs.mkdirSync(path.join(dir, "_astro"));
    fs.writeFileSync(
      path.join(dir, "_astro", "huge.js"),
      Buffer.alloc(2 * 1024 * 1024),
    );
    const r = runScript("scripts/check/budgets.mjs", ["--dist", dir]);
    fs.rmSync(dir, { recursive: true, force: true });
    assert.equal(r.status, 1);
    assert.match(`${r.stderr}${r.stdout}`, /huge\.js/);
    assert.match(`${r.stderr}${r.stdout}`, /budget/i);
  });

  it("excludes paths listed in .assetsignore (media served from R2)", () => {
    const dir = makeDist();
    fs.mkdirSync(path.join(dir, "media"));
    fs.writeFileSync(path.join(dir, ".assetsignore"), "media\n");
    fs.writeFileSync(
      path.join(dir, "media", "hero.mp4"),
      Buffer.alloc(2 * 1024 * 1024),
    );
    fs.writeFileSync(path.join(dir, "index.html"), "<html></html>");
    const r = runScript("scripts/check/budgets.mjs", ["--dist", dir]);
    fs.rmSync(dir, { recursive: true, force: true });
    assert.equal(r.status, 0, r.stderr);
  });

  it("flags a share image that is not 1600x900", () => {
    const dir = makeDist();
    fs.mkdirSync(path.join(dir, "media"));
    // Minimal JPEG: SOI + SOF0 declaring 800x600, enough for the SOF parser.
    const jpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20, 0xff,
      0xd9,
    ]);
    fs.writeFileSync(path.join(dir, "media", "hero-poster.jpg"), jpeg);
    fs.writeFileSync(
      path.join(dir, "index.html"),
      '<meta property="og:image" content="https://q-summit.com/media/hero-poster.jpg" />',
    );
    const r = runScript("scripts/check/budgets.mjs", ["--dist", dir]);
    fs.rmSync(dir, { recursive: true, force: true });
    assert.equal(r.status, 1);
    assert.match(`${r.stderr}${r.stdout}`, /800x600/);
    assert.match(`${r.stderr}${r.stdout}`, /1600x900/);
  });
});

describe("content package example is propose-shaped", () => {
  it("examples/minimal/bundle.json parses and stays under 5 MiB", () => {
    const bundlePath = path.join(
      root,
      "scripts/content-packages/examples/minimal/bundle.json",
    );
    assert.ok(fs.existsSync(bundlePath));
    const raw = fs.readFileSync(bundlePath, "utf-8");
    assert.ok(Buffer.byteLength(raw) < 5 * 1024 * 1024);
    const bundle = JSON.parse(raw);
    assert.equal(typeof bundle.package, "object");
    assert.ok(bundle.collections || bundle.globals);
  });
});

describe("lighthouse helpers", () => {
  it("parseLighthouseUrls defaults and normalizes paths", async () => {
    const { parseLighthouseUrls, DEFAULT_LIGHTHOUSE_URLS } =
      await import("./lighthouse-urls.mjs");
    assert.deepEqual(parseLighthouseUrls(""), DEFAULT_LIGHTHOUSE_URLS);
    assert.deepEqual(parseLighthouseUrls("/ ,speaker"), ["/", "/speaker"]);
  });

  it("rateMetric maps CWV bands", async () => {
    const { rateMetric, CWV } = await import("./lighthouse-report.mjs");
    assert.equal(rateMetric(2000, CWV.lcp), "good");
    assert.equal(rateMetric(3000, CWV.lcp), "needs-improvement");
    assert.equal(rateMetric(5000, CWV.lcp), "poor");
    assert.equal(rateMetric(0.05, CWV.cls), "good");
    assert.equal(rateMetric(0.2, CWV.cls), "needs-improvement");
    assert.equal(rateMetric(0.4, CWV.cls), "poor");
  });

  it("formatAgentMarkdown includes actionable sections", async () => {
    const { formatAgentMarkdown } = await import("./lighthouse-report.mjs");
    const md = formatAgentMarkdown({
      generatedAt: "2026-01-01T00:00:00.000Z",
      mode: "cf",
      modeDescription: "test",
      outDir: ".lighthouse",
      pages: [
        {
          urlPath: "/",
          scores: {
            performance: 97,
            accessibility: 100,
            "best-practices": 96,
            seo: 100,
          },
          metrics: {
            lcp: { display: "2.4 s", rating: "good" },
            cls: { display: "0", rating: "good" },
            tbt: { display: "10 ms", rating: "good" },
          },
          lcpElement: "img.hero",
          clsCulprits: [{ score: 0.1, node: "div.banner" }],
          opportunities: [
            {
              id: "uses-responsive-images",
              title: "Properly size images",
              savingsMs: 200,
            },
          ],
          diagnostics: [],
          failedAudits: [],
          thresholdFailures: [],
        },
      ],
    });
    assert.match(md, /Lighthouse agent report/);
    assert.match(md, /LCP element/);
    assert.match(md, /CLS culprits/);
    assert.match(md, /Properly size images/);
    assert.match(md, /PASS/);
  });
});

describe("check/events", () => {
  it("parses the frozen taxonomy and accepts the current tree", async () => {
    const { parseAllowed, run } = await import("./events.mjs");
    const allowed = parseAllowed(
      fs.readFileSync(
        path.join(root, "apps/web/src/lib/analytics/events.ts"),
        "utf8",
      ),
    );
    assert.ok(allowed.has("ticket_purchase_initiated"));
    assert.ok(allowed.has("faq_opened"));
    // The live tree must be clean, or check:fast would fail.
    assert.deepEqual(run().problems, []);
  });

  it("flags literals, unknown names, PII keys, and identify()", async () => {
    const { lintText, parseAllowed } = await import("./events.mjs");
    const allowed = parseAllowed(
      'export const EVENTS = {\n  faq_opened: "faq_opened",\n}',
    );
    const bad = [
      'data-ph-event="faq_opened"', // literal instead of EVENTS.*
      'pageEvent={{ name: "faq_opened" }}', // literal instead of EVENTS.*
      'posthog.capture("made_up_event")', // outside the taxonomy
      "el.dataset x data-ph-prop-email={user.email}", // PII key on analytics line
      "posthog.identify(id)", // identity is forbidden
    ].map((line) => lintText("src/pages/x.astro", line, allowed));
    for (const problems of bad) assert.equal(problems.length, 1);
    const good = [
      "data-ph-event={EVENTS.faq_opened}",
      'posthog.capture("faq_opened")',
      'capture("$pageview")', // PostHog-internal names pass
      'const email = "mailto"; // not an analytics line',
    ].map((line) => lintText("src/pages/x.astro", line, allowed));
    for (const problems of good) assert.deepEqual(problems, []);
    // The analytics lib itself is exempt (it defines the machinery).
    assert.deepEqual(
      lintText("src/lib/analytics/dom.ts", 'capture("anything")', allowed),
      [],
    );
  });
});
