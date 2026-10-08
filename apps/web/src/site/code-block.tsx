import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/core/button/button";
import { cn } from "@/lib/utils";

// Shiki is big: loaded with the first code block, on the client only (from an
// effect), so it stays out of the server bundle, which must fit a Cloudflare Worker.
const loadHighlighter = import.meta.env.SSR
  ? () => Promise.reject(new Error("Code is highlighted on the client"))
  : () => import("./highlighter");

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className={cn("text-muted-foreground", className)}
      onPress={() => {
        void navigator.clipboard?.writeText(value).then(() => setCopied(true));
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

export function CodeBlock({
  code,
  lang = "tsx",
  title,
  className,
}: {
  code: string;
  lang?: string;
  title?: string;
  className?: string;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setHtml(null);
    void loadHighlighter()
      .then(({ highlight }) => highlight(code, lang))
      .then((result) => active && setHtml(result))
      .catch(() => {
        // Unknown language or failed chunk: the plain text stays.
      });
    return () => {
      active = false;
    };
  }, [code, lang]);

  return (
    <div
      data-slot="code-block"
      className={cn("relative overflow-hidden rounded-xl border bg-card text-sm", className)}
    >
      {title && (
        <div className="flex h-10 items-center border-b px-4 font-mono text-xs text-muted-foreground">
          {title}
        </div>
      )}
      <CopyButton value={code} className={cn("absolute right-2", title ? "top-1.5" : "top-2")} />
      {html ? (
        <div
          className="[&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:pr-12 [&_pre]:!bg-transparent [&_code]:font-mono [&_code]:text-[0.8125rem] [&_code]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 pr-12 font-mono text-[0.8125rem] leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
