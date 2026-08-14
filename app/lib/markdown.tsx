// A small, dependency-free renderer for the light markdown (and LaTeX-ish
// \[...\]/\(...\) math delimiters) a connected live model tends to reply
// with -- headers, bold/italic, lists, rules, and inline code -- so the demo
// chat shows formatted text instead of raw "**bold**"/"### Heading" syntax.

import { Fragment, type ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\\\((.+?)\\\)/g;
  let last = 0, match: RegExpExecArray | null, i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) nodes.push(<strong key={`${keyPrefix}b${i}`}>{match[1]}</strong>);
    else if (match[2] !== undefined) nodes.push(<em key={`${keyPrefix}i${i}`}>{match[2]}</em>);
    else if (match[3] !== undefined) nodes.push(<code key={`${keyPrefix}c${i}`}>{match[3]}</code>);
    else if (match[4] !== undefined) nodes.push(<em key={`${keyPrefix}m${i}`} className="md-math">{match[4]}</em>);
    last = pattern.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function renderMarkdown(text: string): ReactNode {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(<Tag key={key++}>{list.items.map((item, i) => <li key={i}>{renderInline(item, `l${key}${i}`)}</li>)}</Tag>);
    list = null;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (!line) { flushList(); continue; }
    if (/^-{3,}$/.test(line)) { flushList(); blocks.push(<hr key={key++} />); continue; }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushList();
      const level = Math.min(heading[1].length, 4);
      const HeadingTag = (`h${level}` as unknown) as "h1" | "h2" | "h3" | "h4";
      blocks.push(<HeadingTag key={key++}>{renderInline(heading[2], `h${key}`)}</HeadingTag>);
      continue;
    }
    // Display math: either a single "\[ ... \]" line, or "\[" opening a block
    // that's closed by a later standalone "\]" line -- models often emit it
    // spread across three lines.
    const inlineMathBlock = /^\\\[(.*)\\\]$/.exec(line);
    if (inlineMathBlock) { flushList(); blocks.push(<p key={key++} className="md-math-block">{inlineMathBlock[1].trim()}</p>); continue; }
    if (line === "\\[") {
      flushList();
      const content: string[] = [];
      let end = idx + 1;
      while (end < lines.length && lines[end].trim() !== "\\]") { content.push(lines[end].trim()); end++; }
      blocks.push(<p key={key++} className="md-math-block">{content.join(" ")}</p>);
      idx = end;
      continue;
    }
    const ordered = /^\d+[.)]\s+(.*)$/.exec(line);
    const bulleted = /^[-*]\s+(.*)$/.exec(line);
    if (ordered || bulleted) {
      const isOrdered = !!ordered;
      const content = (ordered ?? bulleted)![1];
      if (!list || list.ordered !== isOrdered) { flushList(); list = { ordered: isOrdered, items: [] }; }
      list.items.push(content);
      continue;
    }
    flushList();
    blocks.push(<p key={key++}>{renderInline(line, `p${key}`)}</p>);
  }
  flushList();
  return <Fragment>{blocks}</Fragment>;
}
