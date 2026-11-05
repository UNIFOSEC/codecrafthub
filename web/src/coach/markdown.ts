import { h, type Child } from "../ui/dom";

/**
 * A small Markdown renderer for Coach replies: paragraphs, headings, lists,
 * quotes, fenced code, **bold**, *italic*, `code` and links.
 *
 * Model output is untrusted, so this builds DOM nodes directly. Text is only
 * ever inserted as text nodes, and links are limited to http(s).
 */
export function renderMarkdown(source: string): HTMLElement[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: HTMLElement[] = [];
  let i = 0;

  const isListItem = (line: string) => /^\s*([-*+]|\d+[.)])\s+/.test(line);
  const isSpecial = (line: string) => /^(```|#{1,6}\s|>\s?|-{3,}\s*$)/.test(line.trim()) || isListItem(line);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = /^\s*```(.*)$/.exec(line);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++; // closing fence (or end of a still-streaming reply)
      blocks.push(h("pre", { class: "md-pre" }, h("code", {}, code.join("\n"))));
      continue;
    }

    const heading = /^\s*#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(h("p", { class: "md-heading" }, inline(heading[1])));
      i++;
      continue;
    }

    if (/^\s*-{3,}\s*$/.test(line)) {
      blocks.push(h("hr", { class: "md-hr" }));
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(h("blockquote", { class: "md-quote" }, inline(quote.join(" "))));
      continue;
    }

    if (isListItem(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: HTMLElement[] = [];
      while (i < lines.length && isListItem(lines[i]) && /^\s*\d+[.)]\s+/.test(lines[i]) === ordered) {
        let content = lines[i++].replace(/^\s*([-*+]|\d+[.)])\s+/, "");
        // Lazy continuation lines belong to the same item
        while (i < lines.length && lines[i].trim() && !isSpecial(lines[i])) content += " " + lines[i++].trim();
        items.push(h("li", {}, inline(content)));
      }
      blocks.push(h(ordered ? "ol" : "ul", { class: "md-list" }, items));
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !isSpecial(lines[i])) paragraph.push(lines[i++].trim());
    const children: Child[] = [];
    paragraph.forEach((text, index) => {
      if (index > 0) children.push(h("br"));
      children.push(inline(text));
    });
    blocks.push(h("p", {}, children));
  }

  return blocks;
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))/g;

function inline(text: string): Child[] {
  const out: Child[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    const [token, code, bold, italic, link] = match;
    if (code) out.push(h("code", { class: "md-code" }, code.slice(1, -1)));
    else if (bold) out.push(h("strong", {}, inline(bold.slice(2, -2))));
    else if (italic) out.push(h("em", {}, inline(italic.slice(1, -1))));
    else if (link) out.push(renderLink(link));
    else out.push(token);
    last = index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderLink(token: string): Child {
  const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token) ?? [];
  let url: URL | null = null;
  try {
    url = new URL(href);
  } catch {
    // not an absolute URL
  }
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return label ?? token;
  return h("a", { class: "link", attrs: { href: url.href, target: "_blank", rel: "noopener noreferrer nofollow" } }, label);
}
