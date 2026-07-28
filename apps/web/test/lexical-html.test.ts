import { describe, expect, it } from "vitest";

import { lexicalToHtml } from "../src/lib/lexical-html";

function doc(children: unknown[]) {
  return { root: { type: "root", children } };
}

describe("lexicalToHtml", () => {
  it("escapes text and keeps basic structure", () => {
    const html = lexicalToHtml(
      doc([
        {
          type: "paragraph",
          children: [{ type: "text", text: `Hello <script> & "quotes"` }],
        },
      ]),
    );
    expect(html).toBe("<p>Hello &lt;script&gt; &amp; &quot;quotes&quot;</p>");
  });

  it("allowlists heading tags and falls back to h3", () => {
    expect(
      lexicalToHtml(
        doc([
          {
            type: "heading",
            tag: "h2",
            children: [{ type: "text", text: "Title" }],
          },
        ]),
      ),
    ).toBe("<h2>Title</h2>");
    expect(
      lexicalToHtml(
        doc([
          {
            type: "heading",
            tag: 'img onerror="alert(1)"',
            children: [{ type: "text", text: "x" }],
          },
        ]),
      ),
    ).toBe("<h3>x</h3>");
  });

  it("blocks javascript: and data: hrefs; escapes quotes in safe hrefs", () => {
    expect(
      lexicalToHtml(
        doc([
          {
            type: "link",
            fields: { url: "javascript:alert(1)" },
            children: [{ type: "text", text: "bad" }],
          },
        ]),
      ),
    ).toBe("bad");

    expect(
      lexicalToHtml(
        doc([
          {
            type: "link",
            fields: { url: 'https://example.com/" onclick="alert(1)' },
            children: [{ type: "text", text: "x" }],
          },
        ]),
      ),
    ).toBe('<a href="https://example.com/%22%20onclick=%22alert(1)">x</a>');

    expect(
      lexicalToHtml(
        doc([
          {
            type: "link",
            fields: { url: "/jobs", newTab: true },
            children: [{ type: "text", text: "Jobs" }],
          },
        ]),
      ),
    ).toBe(
      '<a href="/jobs" target="_blank" rel="noopener noreferrer">Jobs</a>',
    );
  });
});
