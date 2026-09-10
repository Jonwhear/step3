/**
 * Renders the constrained markdown subset used by lecture sections.
 *
 * Deliberately hand-rolled rather than a markdown library: the supported
 * grammar is three constructs (paragraph, `- ` bullet, `**bold**`), and parsing
 * only those means authored content can never inject markup. Anything the
 * grammar does not recognise renders as literal text.
 */

import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  // Split on the bold delimiter, keeping the captured content.
  return text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-ink-900">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

interface Block {
  kind: "paragraph" | "list";
  lines: string[];
}

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];

    if (bullet) {
      const content = bullet[1] ?? "";
      if (last?.kind === "list") last.lines.push(content);
      else blocks.push({ kind: "list", lines: [content] });
    } else if (last?.kind === "paragraph") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "paragraph", lines: [line] });
    }
  }
  return blocks;
}

export function LectureBody({
  body,
  className = "",
}: {
  body: string;
  className?: string;
}) {
  const blocks = parseBlocks(body);
  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, index) =>
        block.kind === "list" ? (
          <ul key={index} className="space-y-1">
            {block.lines.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-800">
                <span aria-hidden="true" className="text-clinical-500">
                  •
                </span>
                <span>{renderInline(line)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={index} className="text-sm leading-relaxed text-ink-800">
            {renderInline(block.lines.join(" "))}
          </p>
        ),
      )}
    </div>
  );
}
