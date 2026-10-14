import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "@babel/parser";
import type * as t from "@babel/types";
import { describe, expect, it } from "vitest";
import {
  formatSnippets,
  installedImport,
  type SnippetKind,
  storySnippets,
} from "../scripts/story-snippets";

// The docs site shows each story's generated snippet as the example's code, for
// readers to paste into their own project. These gates keep that code
// self-contained: nothing from the story (args, spies, Storybook imports) leaks
// into it, every name it uses is imported or declared, and imports point where
// the shadcn CLI installs the items.

const SRC = join(import.meta.dirname, "../src");

/** Globals an example may use without importing them (browser + JS). */
const GLOBALS = new Set([
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLDivElement",
  "HTMLButtonElement",
  "File",
  "FileList",
  "Blob",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
  "FormData",
  "undefined",
  "JSX",
  // TypeScript's own types (and `as const`).
  "const",
  "Partial",
  "Required",
  "Readonly",
  "Record",
  "Pick",
  "Omit",
  "ReturnType",
  "Parameters",
  "NonNullable",
  "Awaited",
]);

function storyFiles() {
  const files: { name: string; kind: SnippetKind; path: string }[] = [];
  for (const kind of ["core", "blocks"] as const) {
    for (const name of readdirSync(join(SRC, kind))) {
      const path = join(SRC, kind, name, `${name}.stories.tsx`);
      if (existsSync(path)) files.push({ name, kind, path });
    }
  }
  return files;
}

type Node = t.Node;

function walk(node: Node, visit: (node: Node, parent: Node | null, key: string) => void) {
  const recurse = (current: Node, parent: Node | null, key: string) => {
    visit(current, parent, key);
    for (const [childKey, value] of Object.entries(current)) {
      if (childKey === "loc" || childKey.endsWith("Comments") || childKey === "extra") continue;
      for (const child of Array.isArray(value) ? value : [value]) {
        if (child && typeof child === "object" && typeof child.type === "string") {
          recurse(child, current, childKey);
        }
      }
    }
  };
  recurse(node, null, "");
}

/** Names the snippet uses that nothing in it imports or declares (no scope analysis). */
function unresolved(program: t.Program) {
  const bound = new Set<string>();
  const used = new Map<string, number>();
  walk(program, (node, parent, key) => {
    if (node.type === "Identifier") {
      const binding =
        (parent?.type === "VariableDeclarator" && key === "id") ||
        ((parent?.type === "FunctionDeclaration" ||
          parent?.type === "FunctionExpression" ||
          parent?.type === "ArrowFunctionExpression" ||
          parent?.type === "ObjectMethod") &&
          (key === "params" || key === "id")) ||
        (parent?.type === "ObjectProperty" && key === "value" && isPattern(parent)) ||
        parent?.type === "ArrayPattern" ||
        parent?.type === "RestElement" ||
        (parent?.type === "AssignmentPattern" && key === "left") ||
        (parent?.type === "CatchClause" && key === "param") ||
        ((parent?.type === "TSFunctionType" ||
          parent?.type === "TSConstructorType" ||
          parent?.type === "TSMethodSignature" ||
          parent?.type === "TSCallSignatureDeclaration" ||
          parent?.type === "TSDeclareFunction") &&
          (key === "parameters" || key === "params")) ||
        ((parent?.type === "TSTypeAliasDeclaration" ||
          parent?.type === "TSInterfaceDeclaration" ||
          parent?.type === "TSEnumDeclaration" ||
          parent?.type === "ClassDeclaration" ||
          parent?.type === "TSTypeParameter") &&
          key === "id") ||
        parent?.type === "TSTypeParameter" ||
        parent?.type === "ImportSpecifier" ||
        parent?.type === "ImportDefaultSpecifier" ||
        parent?.type === "ImportNamespaceSpecifier";
      const skip =
        ((parent?.type === "ObjectProperty" ||
          parent?.type === "ObjectMethod" ||
          parent?.type === "ClassMethod" ||
          parent?.type === "TSPropertySignature" ||
          parent?.type === "TSMethodSignature") &&
          key === "key" &&
          !(parent as { computed?: boolean }).computed) ||
        ((parent?.type === "MemberExpression" || parent?.type === "OptionalMemberExpression") &&
          key === "property" &&
          !parent.computed) ||
        (parent?.type === "TSQualifiedName" && key === "right") ||
        parent?.type === "LabeledStatement" ||
        (parent?.type === "TSIndexedAccessType" && false);
      if (binding) bound.add(node.name);
      else if (!skip) used.set(node.name, (used.get(node.name) ?? 0) + 1);
    } else if (node.type === "JSXIdentifier") {
      const tag =
        (parent?.type === "JSXOpeningElement" || parent?.type === "JSXClosingElement") &&
        key === "name";
      if (
        (tag && /^[A-Z]/.test(node.name)) ||
        (parent?.type === "JSXMemberExpression" && key === "object")
      ) {
        used.set(node.name, 1);
      }
    }
  });
  return [...used.keys()].filter(
    (name) =>
      !bound.has(name) &&
      !GLOBALS.has(name) &&
      !/^(HTML|SVG)\w*Element$/.test(name) &&
      !(name in globalThis),
  );
}

function isPattern(property: t.ObjectProperty) {
  return property.value.type === "Identifier" && property.shorthand !== undefined;
}

/** What keeps a snippet from being pasted as is, as readable messages. */
function snippetProblems(code: string) {
  if (code === "") return ["no snippet"];
  const problems: string[] = [];
  const program = parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] }).program;
  const leak = code.match(/\bargs\b|\bfn\(\)|storybook|\bplay\b:/);
  if (leak) problems.push(`leaks the story: ${leak[0]}`);
  for (const name of unresolved(program)) problems.push(`uses ${name} without importing it`);
  const topLevel = program.body.flatMap((statement) => {
    if (statement.type === "ImportDeclaration") {
      return statement.specifiers.map((specifier) => specifier.local.name);
    }
    const declaration =
      statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type === "VariableDeclaration") {
      return declaration.declarations.flatMap((item) =>
        item.id.type === "Identifier" ? [item.id.name] : [],
      );
    }
    return declaration && "id" in declaration && declaration.id?.type === "Identifier"
      ? [declaration.id.name]
      : [];
  });
  for (const name of new Set(topLevel.filter((item, index) => topLevel.indexOf(item) !== index))) {
    problems.push(`declares ${name} twice`);
  }
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const source = statement.source.value;
    const local = /^(\.|@\/(core|blocks)\/|@\/components\/ui\/)/.test(source);
    const lib = /^@\/(lib|hooks)\/(?!fma-ui\/)/.test(source) && source !== "@/lib/utils";
    if (local || lib) problems.push(`imports ${source}, not an installed path`);
  }
  return problems;
}

describe("story snippets", () => {
  for (const { name, kind, path } of storyFiles()) {
    describe(name, () => {
      const snippets = storySnippets(readFileSync(path, "utf8"), name, kind);
      for (const [story, code] of Object.entries(snippets)) {
        it(`${story} is self-contained, copyable code`, () => {
          expect(snippetProblems(code)).toEqual([]);
        });
      }
    });
  }
});

describe("installedImport", () => {
  it("maps story imports to where the shadcn CLI installs the items", () => {
    expect(installedImport("./badge", "badge", "core")).toBe("@/components/fma-ui/badge");
    expect(installedImport("@/core/button/button", "badge", "core")).toBe(
      "@/components/fma-ui/button",
    );
    expect(installedImport("../button/button", "badge", "core")).toBe("@/components/fma-ui/button");
    expect(installedImport("./app-sidebar", "app-sidebar", "blocks")).toBe(
      "@/components/fma-ui/app-sidebar/app-sidebar",
    );
    expect(installedImport("@/lib/input-masks/index", "x", "core")).toBe(
      "@/lib/fma-ui/input-masks/index",
    );
    expect(installedImport("@/hooks/use-mobile", "x", "core")).toBe("@/hooks/fma-ui/use-mobile");
    expect(installedImport("@/lib/utils", "x", "core")).toBe("@/lib/utils");
    expect(installedImport("lucide-react", "x", "core")).toBe("lucide-react");
  });
});

const STORIES = `import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn } from "storybook/test";
import { Button } from "@/core/button/button";
import { Widget, WidgetGroup } from "./widget";
import meta from "./meta.json";

const ITEMS = ["a", "b"];
const onAction = fn();

function Harness() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <Widget value={count} onChange={setCount} />
      <output data-testid="count" className="sr-only">{count}</output>
    </div>
  );
}

const componentMeta = {
  title: "ui/Widget",
  component: Widget,
  decorators: [(Story) => <div className="p-4"><Story /></div>],
  args: { label: "Name", size: "default", isDisabled: false, defaultValue: 1, onChange: fn() },
} satisfies Meta<typeof Widget>;

export default componentMeta;
type Story = StoryObj<typeof componentMeta>;

export const Default: Story = {};

export const Group: Story = {
  args: { label: undefined, children: "Hi" },
  render: (args) => (
    <WidgetGroup>
      <Widget {...args} data-testid="w" />
      <Button onPress={onAction}>{ITEMS.length}</Button>
    </WidgetGroup>
  ),
  play: async ({ args }) => {
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = React.useState(2);
    return <Widget {...args} value={value} onChange={(next) => { setValue(next); args.onChange?.(next); }} />;
  },
};

export const Stateful: Story = {
  render: () => <Harness />,
};

export const ShouldTest: Story = {
  tags: ["!autodocs"],
  play: async () => {},
};
`;

describe("storySnippets", () => {
  const snippets = storySnippets(STORIES, "widget", "core");

  it("leaves out stories hidden from the docs", () => {
    expect(Object.keys(snippets)).toEqual(["Default", "Group", "Controlled", "Stateful"]);
  });

  it("renders the meta component with the args, minus spies and control defaults", () => {
    expect(snippets.Default).toBe(`import { Widget } from "@/components/fma-ui/widget";

export function WidgetDemo() {
  return <Widget label="Name" defaultValue={1} />;
}`);
  });

  it("spells out {...args}, drops test hooks and spies, and brings the file's constants", () => {
    const code = snippets.Group ?? "";
    expect(code).toContain('import { Button } from "@/components/fma-ui/button";');
    expect(code).toContain('import { Widget, WidgetGroup } from "@/components/fma-ui/widget";');
    expect(code).toContain('const ITEMS = ["a", "b"];');
    expect(code).toContain("<Widget defaultValue={1}>Hi</Widget>");
    expect(code).toContain("<Button>{ITEMS.length}</Button>");
    expect(code).toContain("export function WidgetGroupDemo()");
    expect(code).not.toMatch(/onAction|data-testid|label=/);
  });

  it("lets a controlled prop replace its default and drops calls to spies", () => {
    const code = snippets.Controlled ?? "";
    expect(code).toContain('<Widget label="Name" value={value}');
    expect(code).not.toContain("defaultValue");
    expect(code).not.toContain("onChange?.");
    expect(code).toContain("setValue(next);");
  });

  it("makes a story's only component, without props, the example itself", () => {
    const code = snippets.Stateful ?? "";
    expect(code).toContain("export function WidgetStateful() {");
    expect(code).not.toContain("Harness");
    expect(code).not.toContain("<output");
  });
});

describe("formatSnippets", () => {
  it("formats with the repo's Biome config", () => {
    const formatted = formatSnippets({ a: "export function A(){return <div className='x'  />}" });
    expect(formatted.a).toBe(`export function A() {\n  return <div className="x" />;\n}`);
  });
});
