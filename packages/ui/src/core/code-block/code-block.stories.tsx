import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageSquarePlusIcon } from "lucide-react";
import * as React from "react";
import { expect, fn, spyOn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/core/button/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/card/card";
import { ansiToLines, parseUnifiedDiff } from "@/lib/code-block-highlight";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockExpandButton,
  CodeBlockHeader,
  CodeBlockLanguage,
  CodeBlockLineActions,
  CodeBlockTitle,
  CodeBlockWrapToggle,
  useCodeBlockFolding,
} from "./code-block";
import meta from "./meta.json";

const CODE = `import { useMemo } from "react";

type Item = { price: number; quantity: number };

export function useTotals(items: Item[]) {
  return useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;
    return { subtotal, tax, total: subtotal + tax };
  }, [items]);
}`;

const componentMeta = {
  title: "ui/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: meta.description } },
  },
  args: { code: CODE, language: "tsx", className: "max-w-2xl" },
} satisfies Meta<typeof CodeBlock>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

const tokens = (element: HTMLElement) => element.querySelectorAll('[data-slot="code-block-token"]');

/** Highlighted on the client, with a copy button pinned over the code. */
export const Default: Story = {
  render: (args) => (
    <CodeBlock {...args}>
      <CodeBlockCopyButton />
    </CodeBlock>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("region", { name: "tsx code" })).toHaveTextContent(
      "export function useTotals",
    );
    await waitFor(() => expect(tokens(canvasElement).length).toBeGreaterThan(10));

    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await userEvent.click(canvas.getByRole("button", { name: "Copy code" }));
    await expect(writeText).toHaveBeenCalledWith(CODE);
    await expect(await canvas.findByRole("button", { name: "Copied" })).toBeInTheDocument();
    writeText.mockRestore();
  },
};

/** A header holds the title, the resolved language and inline controls. */
export const WithHeader: Story = {
  args: { showLineNumbers: true },
  render: (args) => (
    <CodeBlock {...args}>
      <CodeBlockHeader>
        <CodeBlockTitle>use-totals.ts</CodeBlockTitle>
        <CodeBlockLanguage />
        <div className="ml-auto flex items-center">
          <CodeBlockWrapToggle />
          <CodeBlockDownloadButton filename="use-totals.ts" />
          <CodeBlockCopyButton />
        </div>
      </CodeBlockHeader>
    </CodeBlock>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText("tsx")).toBeInTheDocument();
    const toggle = canvas.getByRole("button", { name: "Wrap" });
    await userEvent.click(toggle);
    await expect(canvas.getByRole("button", { name: "No wrap" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvasElement.querySelector("pre")).toHaveAttribute("data-wrap");
  },
};

/** Line specs mark source lines: highlights, words, focus (the rest dims until hover) and diagnostics. */
export const LineMarks: Story = {
  args: {
    showLineNumbers: true,
    startLine: 40,
    highlightedLines: "7-9",
    highlightedWords: ["subtotal"],
    lineLevels: { warning: [10] },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelectorAll("[data-highlighted]")).toHaveLength(3),
    );
    await expect(canvasElement.querySelector('[data-code-line="49"]')).toHaveAttribute(
      "data-level",
      "warning",
    );
    await expect(canvasElement.querySelectorAll("[data-word]").length).toBeGreaterThan(0);
  },
};

/** `diff` tints added and removed lines and draws +/- glyphs outside the copied text. */
export const Diff: Story = {
  args: {
    showLineNumbers: true,
    diff: { removed: [2], added: [3] },
    code: `const subtotal = sum(items);
const tax = subtotal * 0.08;
const tax = subtotal * rate;
return { subtotal, tax };`,
  },
};

const PATCH = `diff --git a/src/totals.ts b/src/totals.ts
--- a/src/totals.ts
+++ b/src/totals.ts
@@ -8,4 +8,4 @@ export function useTotals(items: Item[]) {
     }, 0);
-    const tax = subtotal * 0.08;
+    const tax = subtotal * rate;
     return { subtotal, tax, total: subtotal + tax };`;

/** `parseUnifiedDiff` turns a git patch into lines with tints, +/- glyphs and old/new gutters. */
export const UnifiedPatch: Story = {
  args: { code: undefined },
  render: (args) => {
    const [file] = parseUnifiedDiff(PATCH);
    return (
      <CodeBlock {...args} lines={file.lines} showLineNumbers>
        <CodeBlockHeader>
          <CodeBlockTitle>{file.file}</CodeBlockTitle>
          <span className="ml-auto text-xs text-success">+{file.added}</span>
          <span className="text-xs text-destructive">-{file.removed}</span>
        </CodeBlockHeader>
      </CodeBlock>
    );
  },
};

const TERMINAL = [
  "\x1b[1m$ pnpm test\x1b[0m",
  "\x1b[32m✓\x1b[0m tests/totals.test.ts \x1b[2m(4 tests)\x1b[0m",
  "\x1b[31m✗\x1b[0m tests/tax.test.ts \x1b[31m1 failed\x1b[0m",
].join("\n");

/** `ansiToLines` renders terminal colours; wrap the block in `.dark` to keep it dark. */
export const Terminal: Story = {
  args: { code: undefined, lines: ansiToLines(TERMINAL), label: "Terminal output" },
  render: (args) => (
    <div className="dark max-w-2xl text-foreground">
      <CodeBlock {...args} />
    </div>
  ),
};

/** `foldable` folds by indentation; nested regions keep their state under a folded parent. */
export const Folding: Story = {
  args: { foldable: true, showLineNumbers: true },
  render: function Render(args) {
    return (
      <CodeBlock {...args}>
        <CodeBlockHeader>
          <CodeBlockTitle>use-totals.ts</CodeBlockTitle>
          <FoldAll />
        </CodeBlockHeader>
      </CodeBlock>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Fold lines 5 to 12" }));
    await expect(canvasElement.querySelector('[data-code-line="6"]')).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Unfold 7 hidden lines" }));
    await expect(canvasElement.querySelector('[data-code-line="6"]')).not.toBeNull();
  },
};

function FoldAll() {
  const { foldedStarts, foldAll, unfoldAll } = useCodeBlockFolding();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="ml-auto"
      onPress={foldedStarts.length ? unfoldAll : foldAll}
    >
      {foldedStarts.length ? "Unfold all" : "Fold all"}
    </Button>
  );
}

/** `selectable` makes the lines a listbox: arrows move, Enter toggles, Shift extends. One action group follows the active line. */
export const SelectableWithLineActions: Story = {
  args: { selectable: true, showLineNumbers: true, onSelectedLinesChange: fn() },
  render: (args) => (
    <CodeBlock {...args}>
      <CodeBlockLineActions>
        {({ line }) => (
          <Button size="icon-xs" variant="outline" aria-label={`Ask about line ${line}`}>
            <MessageSquarePlusIcon />
          </Button>
        )}
      </CodeBlockLineActions>
    </CodeBlock>
  ),
  play: async ({ canvas, args }) => {
    const region = canvas.getByRole("region", { name: "tsx code" });
    region.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    await expect(args.onSelectedLinesChange).toHaveBeenLastCalledWith([2]);
    await userEvent.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    await expect(args.onSelectedLinesChange).toHaveBeenLastCalledWith([2, 3, 4]);
    await expect(canvas.getByRole("listbox")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Ask about line 4" })).toBeInTheDocument();
  },
};

/** `maxLines` collapses a long file behind a Show more control. */
export const Collapsible: Story = {
  args: { maxLines: 6 },
  render: (args) => (
    <CodeBlock {...args}>
      <CodeBlockExpandButton />
    </CodeBlock>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Show more" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(button);
    await expect(canvas.getByRole("button", { name: "Show less" })).toBeInTheDocument();
  },
};

/** `streaming` shows a caret and sticks to the bottom while the code grows. */
export const Streaming: Story = {
  args: { code: "" },
  render: function Render(args) {
    const [length, setLength] = React.useState(0);
    const streaming = length > 0 && length < CODE.length;
    React.useEffect(() => {
      if (!streaming) return;
      const timer = setTimeout(() => setLength((value) => Math.min(CODE.length, value + 6)), 30);
      return () => clearTimeout(timer);
    }, [streaming]);
    return (
      <div className="flex max-w-2xl flex-col items-start gap-2">
        <Button size="sm" variant="outline" onPress={() => setLength(1)}>
          {length === 0 ? "Start" : "Restart"}
        </Button>
        <CodeBlock
          {...args}
          className="w-full"
          code={CODE.slice(0, length)}
          streaming={streaming}
          maxLines={8}
        />
      </div>
    );
  },
};

/** `variant="ghost"` drops the border inside a Card; `CodeBlockContent` lets an outer container own the scroll. */
export const InCard: Story = {
  render: (args) => (
    <Card className="max-w-2xl gap-0 py-0">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-sm">Totals hook</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <CodeBlock {...args} className="" variant="ghost">
          <div className="max-h-48 overflow-auto">
            <CodeBlockContent />
          </div>
        </CodeBlock>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-slot="code-block-content"]')).toHaveLength(
      1,
    );
  },
};

/** `highlight={false}` renders plain text and never loads shiki. */
export const PlainText: Story = {
  args: { highlight: false },
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(tokens(canvasElement)).toHaveLength(0);
    await expect(within(canvasElement).getByText(/export function useTotals/)).toBeVisible();
  },
};
