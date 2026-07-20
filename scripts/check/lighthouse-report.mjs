/**
 * Turn a Lighthouse Result (lhr) into an agent-ready findings object.
 *
 * Lab simulation assumptions (Lighthouse defaults / web.dev):
 *   - Mobile form factor (moto g power), Slow 4G simulate throttling
 *   - TBT is the lab proxy for INP (INP is field-only)
 *   - CWV bands: LCP ≤2.5s / CLS ≤0.1 good; TBT used diagnostically
 *
 * Lighthouse 13+ moved several details into *-insight audits
 * (lcp-discovery-insight, image-delivery-insight, …).
 *
 * Sources: web.dev/vitals, Lighthouse docs/throttling.md (Slow 4G = ~85th
 * percentile mobile), defaultConfig.settings in lighthouse package.
 */

/** @typedef {'good' | 'needs-improvement' | 'poor' | 'unknown'} Rating */

const CWV = {
  lcp: { good: 2500, poor: 4000, unit: "ms" },
  cls: { good: 0.1, poor: 0.25, unit: "score" },
  tbt: { good: 200, poor: 600, unit: "ms" }, // lab INP proxy bands (Lighthouse)
  fcp: { good: 1800, poor: 3000, unit: "ms" },
  ttfb: { good: 800, poor: 1800, unit: "ms" },
  si: { good: 3400, poor: 5800, unit: "ms" },
};

/**
 * @param {number | null | undefined} value
 * @param {{ good: number, poor: number }} bands
 * @returns {Rating}
 */
export function rateMetric(value, bands) {
  if (value == null || Number.isNaN(value)) return "unknown";
  if (value <= bands.good) return "good";
  if (value <= bands.poor) return "needs-improvement";
  return "poor";
}

function auditNumeric(lhr, id) {
  const a = lhr.audits?.[id];
  if (!a || a.numericValue == null) return null;
  return a.numericValue;
}

function auditDisplay(lhr, id) {
  return lhr.audits?.[id]?.displayValue ?? null;
}

function nodeSnippet(node) {
  if (!node) return null;
  if (typeof node === "string") return node;
  return (
    node.snippet ||
    node.selector ||
    node.nodeLabel ||
    node.path ||
    JSON.stringify(node).slice(0, 200)
  );
}

function findNodeInDetails(details) {
  if (!details) return null;
  if (details.type === "node") return details;
  if (Array.isArray(details.items)) {
    for (const item of details.items) {
      if (item?.type === "node") return item;
      if (item?.node) return item.node;
      const nested = findNodeInDetails(item);
      if (nested) return nested;
    }
  }
  return null;
}

function lcpBreakdown(lhr) {
  const audit = lhr.audits?.["lcp-breakdown-insight"];
  const table = audit?.details?.items?.find((i) => i.type === "table");
  if (!table?.items) return [];
  return table.items.map((row) => ({
    label: row.label ?? row.subpart,
    durationMs: row.duration ?? null,
  }));
}

function score100(category) {
  if (!category || category.score == null) return null;
  return Math.round(category.score * 100);
}

function guessCategory(auditId, lhr) {
  for (const [name, cat] of Object.entries(lhr.categories ?? {})) {
    if (cat.auditRefs?.some((r) => r.id === auditId)) return name;
  }
  return null;
}

/**
 * @param {import('lighthouse').Result} lhr
 */
export function extractFindings(lhr) {
  const lcpMs = auditNumeric(lhr, "largest-contentful-paint");
  const cls = auditNumeric(lhr, "cumulative-layout-shift");
  const tbtMs = auditNumeric(lhr, "total-blocking-time");
  const fcpMs = auditNumeric(lhr, "first-contentful-paint");
  const ttfbMs = auditNumeric(lhr, "server-response-time");
  const siMs = auditNumeric(lhr, "speed-index");

  const metrics = {
    lcp: {
      valueMs: lcpMs,
      display: auditDisplay(lhr, "largest-contentful-paint"),
      rating: rateMetric(lcpMs, CWV.lcp),
    },
    cls: {
      value: cls,
      display: auditDisplay(lhr, "cumulative-layout-shift"),
      rating: rateMetric(cls, CWV.cls),
    },
    tbt: {
      valueMs: tbtMs,
      display: auditDisplay(lhr, "total-blocking-time"),
      rating: rateMetric(tbtMs, CWV.tbt),
      note: "Lab proxy for INP (field-only).",
    },
    fcp: {
      valueMs: fcpMs,
      display: auditDisplay(lhr, "first-contentful-paint"),
      rating: rateMetric(fcpMs, CWV.fcp),
    },
    ttfb: {
      valueMs: ttfbMs,
      display: auditDisplay(lhr, "server-response-time"),
      rating: rateMetric(ttfbMs, CWV.ttfb),
    },
    speedIndex: {
      valueMs: siMs,
      display: auditDisplay(lhr, "speed-index"),
      rating: rateMetric(siMs, CWV.si),
    },
  };

  const legacyLcp = lhr.audits?.["largest-contentful-paint-element"];
  const lcpNode =
    findNodeInDetails(lhr.audits?.["lcp-discovery-insight"]?.details) ||
    findNodeInDetails(lhr.audits?.["lcp-breakdown-insight"]?.details) ||
    legacyLcp?.details?.items?.[0]?.node;
  const lcpElement = nodeSnippet(lcpNode) || legacyLcp?.displayValue || null;

  const shiftItems =
    lhr.audits?.["layout-shifts"]?.details?.items ??
    lhr.audits?.["layout-shift-elements"]?.details?.items ??
    [];
  const clsCulprits = shiftItems.slice(0, 8).map((item) => ({
    score: item.score ?? null,
    node: nodeSnippet(item.node),
  }));

  const opportunities = [];
  for (const audit of Object.values(lhr.audits ?? {})) {
    if (!audit) continue;
    if (audit.score == null || audit.score >= 0.9) continue;
    const actionable =
      audit.details?.type === "opportunity" ||
      audit.scoreDisplayMode === "metricSavings" ||
      /-insight$/.test(audit.id || "");
    if (!actionable) continue;
    if (
      !audit.details?.items?.length &&
      audit.numericValue == null &&
      !audit.displayValue
    ) {
      continue;
    }
    opportunities.push({
      id: audit.id,
      title: audit.title,
      displayValue: audit.displayValue ?? null,
      savingsMs: audit.numericValue ?? null,
      description: (audit.description || "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .trim(),
      samples: (audit.details?.items || []).slice(0, 3).map((item) => ({
        url: item.url ?? null,
        wastedBytes: item.wastedBytes ?? null,
        wastedMs: item.wastedMs ?? null,
        node: nodeSnippet(item.node),
      })),
    });
  }
  opportunities.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0));

  const diagnostics = [];
  for (const id of [
    "render-blocking-resources",
    "render-blocking-insight",
    "unused-javascript",
    "unused-css-rules",
    "image-delivery-insight",
    "lcp-discovery-insight",
    "network-dependency-tree-insight",
    "font-display",
    "font-display-insight",
    "total-byte-weight",
    "dom-size",
    "dom-size-insight",
    "third-party-summary",
    "third-parties-insight",
    "unsized-images",
    "uses-responsive-images",
    "modern-image-formats",
  ]) {
    const audit = lhr.audits?.[id];
    if (!audit) continue;
    if (audit.score != null && audit.score >= 0.9) continue;
    if (audit.score == null && audit.scoreDisplayMode !== "informative")
      continue;
    diagnostics.push({
      id: audit.id,
      title: audit.title,
      displayValue: audit.displayValue ?? null,
      score: audit.score,
    });
  }

  const failedAudits = [];
  for (const audit of Object.values(lhr.audits ?? {})) {
    if (!audit || audit.score == null) continue;
    if (
      audit.scoreDisplayMode === "informative" ||
      audit.scoreDisplayMode === "manual" ||
      audit.scoreDisplayMode === "notApplicable"
    ) {
      continue;
    }
    if (audit.score >= 1) continue;
    failedAudits.push({
      id: audit.id,
      title: audit.title,
      score: audit.score,
      displayValue: audit.displayValue ?? null,
      categoryHint: guessCategory(audit.id, lhr),
    });
  }
  failedAudits.sort((a, b) => a.score - b.score);

  return {
    url: lhr.finalDisplayedUrl || lhr.requestedUrl,
    fetchTime: lhr.fetchTime,
    scores: {
      performance: score100(lhr.categories?.performance),
      accessibility: score100(lhr.categories?.accessibility),
      "best-practices": score100(lhr.categories?.["best-practices"]),
      seo: score100(lhr.categories?.seo),
    },
    metrics,
    lcpElement,
    lcpBreakdown: lcpBreakdown(lhr),
    clsCulprits,
    opportunities: opportunities.slice(0, 10),
    diagnostics: diagnostics.slice(0, 12),
    failedAudits: failedAudits.slice(0, 25),
    environment: {
      formFactor: lhr.configSettings?.formFactor ?? null,
      throttlingMethod: lhr.configSettings?.throttlingMethod ?? null,
      throttling: lhr.configSettings?.throttling ?? null,
      screenEmulation: lhr.configSettings?.screenEmulation ?? null,
    },
  };
}

/**
 * @param {object} summary  Aggregated run summary
 * @returns {string} Markdown for agents
 */
export function formatAgentMarkdown(summary) {
  const lines = [];
  lines.push("# Lighthouse agent report");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Mode: \`${summary.mode}\` -- ${summary.modeDescription}`);
  lines.push(
    "Simulation: Lighthouse mobile defaults (moto g power, Slow 4G simulate, CPU 4x).",
  );
  lines.push(
    "Thresholds (Q1): performance/a11y/best-practices/seo ≥ 90. CWV bands from web.dev.",
  );
  lines.push("");
  lines.push("## Scores");
  lines.push("");
  lines.push("| Route | Perf | A11y | BP | SEO | LCP | CLS | TBT | Verdict |");
  lines.push("| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |");
  for (const page of summary.pages) {
    const s = page.scores;
    const m = page.metrics;
    const verdict = page.thresholdFailures.length
      ? `FAIL (${page.thresholdFailures.join("; ")})`
      : "PASS";
    lines.push(
      `| ${page.urlPath} | ${s.performance ?? "?"} | ${s.accessibility ?? "?"} | ${s["best-practices"] ?? "?"} | ${s.seo ?? "?"} | ${m.lcp.display ?? "?"} (${m.lcp.rating}) | ${m.cls.display ?? "?"} (${m.cls.rating}) | ${m.tbt.display ?? "?"} (${m.tbt.rating}) | ${verdict} |`,
    );
  }
  lines.push("");
  lines.push("## Actionable findings");
  lines.push("");

  for (const page of summary.pages) {
    lines.push(`### ${page.urlPath}`);
    lines.push("");
    if (page.lcpElement) {
      lines.push(`- **LCP element:** \`${page.lcpElement}\``);
    }
    if (page.lcpBreakdown?.length) {
      lines.push("- **LCP breakdown:**");
      for (const part of page.lcpBreakdown) {
        lines.push(
          `  - ${part.label}: ${part.durationMs != null ? `${Math.round(part.durationMs)} ms` : "?"}`,
        );
      }
    }
    if (page.clsCulprits?.length) {
      lines.push("- **CLS culprits:**");
      for (const c of page.clsCulprits) {
        lines.push(
          `  - score ${c.score ?? "?"} -- \`${c.node ?? "unknown node"}\``,
        );
      }
    } else {
      lines.push("- **CLS culprits:** none reported");
    }
    if (page.opportunities?.length) {
      lines.push("- **Top opportunities (est. savings):**");
      for (const o of page.opportunities.slice(0, 5)) {
        const save =
          o.displayValue ||
          (o.savingsMs != null && o.savingsMs > 0
            ? `${Math.round(o.savingsMs)} ms`
            : "see samples");
        lines.push(`  - **${o.title}** (${save}): \`${o.id}\``);
        for (const sample of o.samples || []) {
          if (sample.url || sample.node) {
            const label = sample.url || sample.node;
            lines.push(
              `    - \`${label}\`${sample.wastedBytes != null ? ` (~${Math.round(sample.wastedBytes / 1024)} KiB)` : ""}`,
            );
          }
        }
      }
    } else {
      lines.push("- **Top opportunities:** none scored below 0.9");
    }
    if (page.diagnostics?.length) {
      lines.push("- **Diagnostics to check:**");
      for (const d of page.diagnostics.slice(0, 6)) {
        lines.push(
          `  - ${d.title}${d.displayValue ? ` -- ${d.displayValue}` : ""} (\`${d.id}\`)`,
        );
      }
    }
    const a11yFails = (page.failedAudits || []).filter(
      (f) => f.categoryHint === "accessibility" && f.score < 1,
    );
    if (a11yFails.length) {
      lines.push("- **Accessibility fails:**");
      for (const f of a11yFails.slice(0, 8)) {
        lines.push(`  - ${f.title} (\`${f.id}\`, score ${f.score})`);
      }
    }
    lines.push("");
  }

  lines.push("## How to re-run");
  lines.push("");
  lines.push("```sh");
  lines.push("make lighthouse");
  lines.push(
    "make lighthouse ARGS='--skip-build --skip-seed --urls=/'  # fast re-audit",
  );
  lines.push("make lighthouse ARGS='--mode=astro'   # faster, no Worker/R2");
  lines.push(
    "make lighthouse ARGS='--with-picture'  # local Astro <Picture> (optimistic)",
  );
  lines.push("```");
  lines.push("");
  lines.push(
    `Artifacts: \`${summary.outDir}/AGENT.md\` (local). Shared contract: \`${summary.outDir}/README.md\` + \`AGENT.example.md\`.`,
  );
  lines.push("");
  return lines.join("\n");
}

export { CWV };
