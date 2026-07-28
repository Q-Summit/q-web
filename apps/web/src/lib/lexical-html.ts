/*
 * Payload Lexical JSON → safe HTML for `set:html` (FAQ/jobs).
 *
 * Pure module (no Node APIs) so worker-pool tests can import it without
 * pulling in the build-time content layer (node:fs / process).
 *
 * Handles the node types actually present in seeded content: paragraphs,
 * headings, lists, links, bold/italic text, and line breaks. Unknown node
 * types fall back to rendering their children so future additions degrade
 * gracefully instead of vanishing content silently.
 */

interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  fields?: { url?: string; newTab?: boolean };
  [key: string]: unknown;
}

interface LexicalDoc {
  root?: LexicalNode;
}

const TEXT_FORMAT_BOLD = 1;
const TEXT_FORMAT_ITALIC = 2;
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Allow http(s), mailto, and site-relative paths only (blocks javascript:/data:). */
function safeHref(raw: string | undefined): string | null {
  if (raw == null) return null;
  const href = raw.trim();
  if (!href) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  // A same-page anchor is never a URL scheme, so it cannot resolve to
  // javascript:/data: no matter what follows the hash.
  if (href.startsWith("#")) return href;
  try {
    const url = new URL(href);
    if (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:"
    ) {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function renderLexicalChildren(nodes: LexicalNode[] | undefined): string {
  return (nodes ?? []).map(renderLexicalNode).join("");
}

function renderLexicalNode(node: LexicalNode): string {
  switch (node.type) {
    case "text": {
      let html = escapeHtml(node.text ?? "");
      const format = typeof node.format === "number" ? node.format : 0;
      if (format & TEXT_FORMAT_ITALIC) html = `<em>${html}</em>`;
      if (format & TEXT_FORMAT_BOLD) html = `<strong>${html}</strong>`;
      return html;
    }
    case "linebreak":
      return "<br />";
    case "paragraph":
      return `<p>${renderLexicalChildren(node.children)}</p>`;
    case "heading": {
      const raw = typeof node.tag === "string" ? node.tag.toLowerCase() : "h3";
      const tag = HEADING_TAGS.has(raw) ? raw : "h3";
      return `<${tag}>${renderLexicalChildren(node.children)}</${tag}>`;
    }
    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      return `<${tag}>${renderLexicalChildren(node.children)}</${tag}>`;
    }
    case "listitem":
      return `<li>${renderLexicalChildren(node.children)}</li>`;
    case "quote":
      return `<blockquote>${renderLexicalChildren(node.children)}</blockquote>`;
    // Leaf node, no children: without a case of its own the default branch
    // below returns "" and the rule an editor inserted just disappears.
    case "horizontalrule":
      return "<hr />";
    case "link": {
      const href = safeHref(node.fields?.url);
      if (!href) return renderLexicalChildren(node.children);
      const rel = node.fields?.newTab
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return `<a href="${escapeHtml(href)}"${rel}>${renderLexicalChildren(node.children)}</a>`;
    }
    default:
      return Array.isArray(node.children)
        ? renderLexicalChildren(node.children)
        : "";
  }
}

/** Convert Payload Lexical JSON to safe HTML for `set:html` (FAQ/jobs). */
export function lexicalToHtml(doc: unknown): string {
  const root = (doc as LexicalDoc | null | undefined)?.root;
  if (!root || !Array.isArray(root.children)) return "";
  return renderLexicalChildren(root.children);
}
