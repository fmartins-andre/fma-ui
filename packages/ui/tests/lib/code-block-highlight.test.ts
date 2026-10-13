import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  ansiToLines,
  buildWordDecorations,
  highlightCode,
  markdownCodeProps,
  markdownFences,
  parseLineSpec,
  parseUnifiedDiff,
  resolveCodeBlockLanguage,
  stripNotationComments,
  toPlainLines,
} from "@/lib/code-block-highlight";

describe("parseLineSpec", () => {
  it("reads arrays and range strings", () => {
    expect([...parseLineSpec([3, 1])]).toEqual([3, 1]);
    expect([...parseLineSpec("2-4, 7")]).toEqual([2, 3, 4, 7]);
  });

  it("ignores reversed ranges, zero, negatives and garbage instead of throwing", () => {
    expect(parseLineSpec("5-2,0,abc,-3").size).toBe(0);
    expect(parseLineSpec([0, -1, 1.5]).size).toBe(0);
    expect(parseLineSpec(undefined).size).toBe(0);
  });
});

describe("resolveCodeBlockLanguage", () => {
  it("resolves aliases and rejects unknown grammars", () => {
    expect(resolveCodeBlockLanguage(" TS ")).toBe("typescript");
    expect(resolveCodeBlockLanguage("sh")).toBe("shell");
    expect(resolveCodeBlockLanguage("brainfuck")).toBeUndefined();
    expect(resolveCodeBlockLanguage()).toBeUndefined();
  });
});

describe("toPlainLines", () => {
  it("splits on any line ending and numbers from startLine", () => {
    const lines = toPlainLines("a\r\n\nb", 10);
    expect(lines.map((line) => [line.number, line.text])).toEqual([
      [10, "a"],
      [11, ""],
      [12, "b"],
    ]);
    expect(lines[1].tokens).toEqual([]);
  });
});

describe("buildWordDecorations", () => {
  it("marks each occurrence, limited to lines, dropping overlaps", () => {
    const code = "foo bar\nfoo";
    expect(buildWordDecorations(code, ["foo"]).map((d) => d.start)).toEqual([0, 8]);
    expect(buildWordDecorations(code, [{ word: "foo", lines: [2] }]).map((d) => d.start)).toEqual([
      8,
    ]);
    expect(buildWordDecorations(code, ["foo bar", "bar"])).toHaveLength(1);
  });
});

describe("stripNotationComments", () => {
  it("removes [!code] notation in any comment style", () => {
    expect(
      stripNotationComments("a // [!code ++]\nb # [!code focus]\n<i/> <!-- [!code --] -->"),
    ).toBe("a\nb\n<i/>");
  });
});

describe("markdownFences", () => {
  it("splits prose from code and flags an unterminated fence", () => {
    expect(markdownFences("Hi\n```ts\nconst a = 1\n```\nBye\n~~~\nopen")).toEqual([
      { type: "text", content: "Hi", open: false },
      { type: "code", content: "const a = 1", language: "ts", open: false },
      { type: "text", content: "Bye", open: false },
      { type: "code", content: "open", language: undefined, open: true },
    ]);
  });

  it("needs a closer at least as long as the opener", () => {
    const [part] = markdownFences("````md\n```js\nx\n```\n````");
    expect(part).toMatchObject({ type: "code", content: "```js\nx\n```", open: false });
  });
});

describe("markdownCodeProps", () => {
  it("reads code and language from react-markdown pre props", () => {
    const child = createElement("code", { className: "language-tsx" }, "const a", " = 1\n");
    expect(markdownCodeProps({ children: child })).toEqual({
      code: "const a = 1",
      language: "tsx",
    });
  });
});

describe("ansiToLines", () => {
  it("turns SGR colours into tokens and strips other escapes", () => {
    const [line] = ansiToLines("\x1b[31merror\x1b[0m done\x1b[2K");
    expect(line.text).toBe("error done");
    expect(line.tokens[0]).toMatchObject({ content: "error" });
    expect(line.tokens[0].color).toContain("--code-ansi-red");
    expect(line.tokens[1]).toMatchObject({ content: " done", color: undefined });
  });

  it("reads 256-colour and truecolor sequences as literal colours", () => {
    const [line] = ansiToLines("\x1b[38;2;255;0;16mx\x1b[38;5;196my");
    expect(line.tokens.map((token) => token.color)).toEqual(["#ff0010", "#ff0000"]);
  });
});

describe("parseUnifiedDiff", () => {
  const patch = [
    "diff --git a/src/a.ts b/src/a.ts",
    "index 1..2 100644",
    "--- a/src/a.ts",
    "+++ b/src/a.ts",
    "@@ -1,2 +1,2 @@ fn",
    " keep",
    "-old",
    "+new",
  ].join("\n");

  it("returns per-file lines with diff state and dual gutters", () => {
    const [file] = parseUnifiedDiff(patch);
    expect(file).toMatchObject({ file: "src/a.ts", added: 1, removed: 1 });
    expect(file.lines.map((line) => [line.text, line.state?.diff ?? line.state?.level])).toEqual([
      ["fn", "info"],
      ["keep", undefined],
      ["old", "remove"],
      ["new", "add"],
    ]);
    expect(file.lines[2].gutter).toBe(" 2   ");
    expect(file.lines[3].gutter).toBe("    2");
  });
});

describe("highlightCode", () => {
  it("tokenizes with light and dark colours and applies line state", async () => {
    const lines = await highlightCode("const a = 1\nconst b = 2", {
      language: "ts",
      highlightedLines: [2],
      diff: { added: "1" },
    });
    expect(lines.map((line) => line.text)).toEqual(["const a = 1", "const b = 2"]);
    const keyword = lines[0].tokens.find((token) => token.content.trim() === "const");
    expect(keyword?.color).toMatch(/^#/);
    expect(keyword?.colorDark).toMatch(/^#/);
    expect(lines[0].state).toEqual({ diff: "add" });
    expect(lines[1].state).toEqual({ highlighted: true });
  });

  it("reuses unchanged line objects across passes of the same block", async () => {
    const options = { language: "ts", instanceKey: "reuse" };
    const first = await highlightCode("const a = 1", options);
    const second = await highlightCode("const a = 1\nconst b = 2", options);
    expect(second[0]).toBe(first[0]);
  });

  it("renders an unknown language as plain text", async () => {
    const lines = await highlightCode("x", { language: "nope", startLine: 5 });
    expect(lines).toEqual([{ number: 5, text: "x", tokens: [{ content: "x" }] }]);
  });
});
