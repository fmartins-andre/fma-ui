import { Fragment } from "react";

/** Registry descriptions use `code` spans, **bold** and *emphasis*; render just those. */
export function InlineMarkdown({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/).map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.85em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-medium text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

/** Story descriptions: paragraphs (split by blank lines) and "- " lists, of inline markdown. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim());
        const key = `${index}-${lines[0]}`;
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={key} className="my-2 list-disc space-y-1 ps-5">
              {lines.map((line) => (
                <li key={line}>
                  <InlineMarkdown text={line.slice(2)} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={key} className="my-2 first:mt-0 last:mb-0">
            <InlineMarkdown text={lines.join(" ")} />
          </p>
        );
      })}
    </div>
  );
}
