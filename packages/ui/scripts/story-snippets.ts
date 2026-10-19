import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "@babel/parser";
import type * as t from "@babel/types";

/**
 * Copyable example code for each story of a stories file, as the docs site shows
 * it: a component a consumer can paste into their own codebase, not the story
 * object. The story's render becomes the body of `export function <Name>()`,
 * `{...args}` and `args.x` become the props they stand for (the meta's args
 * merged with the story's), `fn()` spies and play functions are dropped, the
 * file's constants and helpers the example uses come along, and imports point
 * where the shadcn CLI installs the items (`@/components/fma-ui/<name>`).
 *
 * A story that can't be expressed this way sets its own code through
 * Storybook's `parameters.docs.source.code`, which wins over the generated one.
 *
 * Node-only (it parses with babel): the docs site runs it at build time, through
 * a Vite plugin, and the llms.txt generator and the unit tests call it directly.
 */

export type SnippetKind = "core" | "blocks";

type Node = t.Node;
type Edit = { start: number; end: number; text: string };
type Arg = { node: t.Expression; spy: boolean };

/** Imports from these sources only serve the stories themselves. */
const STORY_ONLY_SOURCE = /^(storybook($|\/)|@storybook\/)|\.json$/;

/** Story-file names that never belong in an example. */
const STORY_ONLY_NAMES = new Set(["Story", "fn", "expect", "userEvent", "within", "waitFor"]);

const NON_CHILD_KEYS = new Set([
  "type",
  "start",
  "end",
  "loc",
  "range",
  "extra",
  "leadingComments",
  "trailingComments",
  "innerComments",
]);

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && typeof (value as Node).type === "string";
}

/** Depth-first walk; `visit` returning false skips the node's children. */
function walk(
  node: Node,
  visit: (
    node: Node,
    parent: Node | null,
    key: string,
    grandparent: Node | null,
  ) => boolean | undefined,
  parent: Node | null = null,
  key = "",
  grandparent: Node | null = null,
) {
  if (visit(node, parent, key, grandparent) === false) return;
  for (const [childKey, value] of Object.entries(node)) {
    if (NON_CHILD_KEYS.has(childKey)) continue;
    if (Array.isArray(value)) {
      for (const child of value) if (isNode(child)) walk(child, visit, node, childKey, parent);
    } else if (isNode(value)) {
      walk(value, visit, node, childKey, parent);
    }
  }
}

function unwrap(node: Node | null | undefined): Node | null | undefined {
  let current = node;
  while (
    current &&
    (current.type === "TSSatisfiesExpression" ||
      current.type === "TSAsExpression" ||
      current.type === "ParenthesizedExpression")
  ) {
    current = current.expression;
  }
  return current;
}

function propertyKey(property: t.ObjectProperty | t.ObjectMethod): string | null {
  if (property.computed) return null;
  if (property.key.type === "Identifier") return property.key.name;
  if (property.key.type === "StringLiteral") return property.key.value;
  return null;
}

function findProperty(object: t.ObjectExpression, key: string) {
  for (const property of object.properties) {
    if (property.type !== "SpreadElement" && propertyKey(property) === key) return property;
  }
  return undefined;
}

function propertyValue(object: t.ObjectExpression | null | undefined, key: string) {
  const property = object && findProperty(object, key);
  if (!property) return undefined;
  return property.type === "ObjectProperty" ? (property.value as Node) : property;
}

function asObject(node: Node | null | undefined): t.ObjectExpression | null {
  const value = unwrap(node);
  return value?.type === "ObjectExpression" ? value : null;
}

function isSpy(node: Node): boolean {
  const value = unwrap(node);
  if (!value) return false;
  if (value.type === "CallExpression") {
    if (value.callee.type === "Identifier" && value.callee.name === "fn") return true;
    if (value.callee.type === "MemberExpression") return isSpy(value.callee.object);
  }
  return false;
}

function pascal(name: string) {
  return name.replace(/(^|[-_\s]+)(\w)/g, (_, __, char: string) => char.toUpperCase());
}

function staticString(node: Node | null | undefined): string | undefined {
  const value = unwrap(node);
  if (value?.type === "StringLiteral") return value.value;
  if (value?.type === "TemplateLiteral" && value.expressions.length === 0) {
    return value.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

/**
 * Where a story file's import lands in a consumer's project: registry items
 * install into `fma-ui` folders, so siblings resolve to those paths.
 */
export function installedImport(source: string, name: string, kind: SnippetKind) {
  const sibling = source.match(/^\.\/(.+)$/);
  if (sibling) {
    return kind === "core"
      ? `@/components/fma-ui/${sibling[1]}`
      : `@/components/fma-ui/${name}/${sibling[1]}`;
  }
  const component = source.match(/^(?:@\/core|\.\.)\/([\w-]+)\/\1$/);
  if (component) return `@/components/fma-ui/${component[1]}`;
  const block = source.match(/^@\/blocks\/(.+)$/);
  if (block) return `@/components/fma-ui/${block[1]}`;
  if (source === "@/lib/utils") return source;
  const libOrHook = source.match(/^@\/(lib|hooks)\/(.+)$/);
  if (libOrHook) return `@/${libOrHook[1]}/fma-ui/${libOrHook[2]}`;
  return source;
}

function parseModule(code: string) {
  return parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] });
}

/** An identifier at `parent[key]` names a binding: it isn't a property key or a member name. */
function isReference(parent: Node | null, key: string) {
  const isKey =
    (parent?.type === "ObjectProperty" || parent?.type === "ObjectMethod") &&
    key === "key" &&
    !parent.computed;
  const isMember =
    (parent?.type === "MemberExpression" || parent?.type === "OptionalMemberExpression") &&
    key === "property" &&
    !parent.computed;
  const isTypeKey =
    (parent?.type === "TSPropertySignature" || parent?.type === "TSQualifiedName") &&
    (key === "key" || key === "right");
  return !isKey && !isMember && !isTypeKey;
}

/** Names a piece of code refers to (over-approximated: no scope analysis). */
function referencedNames(root: Node) {
  const names = new Set<string>();
  walk(root, (node, parent, key) => {
    if (node.type === "Identifier") {
      if (isReference(parent, key)) names.add(node.name);
    } else if (node.type === "JSXIdentifier") {
      const isTag =
        (parent?.type === "JSXOpeningElement" || parent?.type === "JSXClosingElement") &&
        key === "name";
      const isMemberRoot = parent?.type === "JSXMemberExpression" && key === "object";
      if ((isTag && /^[A-Z]/.test(node.name)) || isMemberRoot) names.add(node.name);
    }
  });
  return names;
}

interface StoryFile {
  file: string;
  name: string;
  kind: SnippetKind;
  imports: t.ImportDeclaration[];
  declarations: Map<string, t.Statement>;
  /** Top-level `const x = fn()`: spies the play functions read. */
  spies: Set<string>;
  metaName?: string;
  metaComponent?: string;
  metaArgs: t.ObjectExpression | null;
  metaRender?: Node;
}

function readStoryFile(file: string, name: string, kind: SnippetKind) {
  const program = parseModule(file).program;
  const context: StoryFile = {
    file,
    name,
    kind,
    imports: [],
    declarations: new Map(),
    spies: new Set(),
    metaArgs: null,
  };
  const stories: { exportName: string; node: Node }[] = [];
  let defaultExport: Node | undefined;

  for (const statement of program.body) {
    if (statement.type === "ImportDeclaration") context.imports.push(statement);
    else if (statement.type === "ExportDefaultDeclaration") defaultExport = statement.declaration;
    else if (statement.type === "ExportNamedDeclaration") {
      if (statement.declaration?.type !== "VariableDeclaration") continue;
      for (const declarator of statement.declaration.declarations) {
        if (declarator.id.type === "Identifier" && declarator.init) {
          stories.push({ exportName: declarator.id.name, node: declarator.init });
        }
      }
    } else if (statement.type === "VariableDeclaration") {
      for (const declarator of statement.declarations) {
        if (declarator.id.type === "Identifier") {
          context.declarations.set(declarator.id.name, statement);
          if (declarator.init && isSpy(declarator.init)) context.spies.add(declarator.id.name);
        } else if (
          declarator.id.type === "ObjectPattern" ||
          declarator.id.type === "ArrayPattern"
        ) {
          walk(declarator.id, (node, parent, key) => {
            if (
              node.type === "Identifier" &&
              !(parent?.type === "ObjectProperty" && key === "key")
            ) {
              context.declarations.set(node.name, statement);
            }
          });
        }
      }
    } else if (
      (statement.type === "FunctionDeclaration" ||
        statement.type === "ClassDeclaration" ||
        statement.type === "TSTypeAliasDeclaration" ||
        statement.type === "TSInterfaceDeclaration" ||
        statement.type === "TSEnumDeclaration") &&
      statement.id
    ) {
      context.declarations.set(statement.id.name, statement);
    }
  }

  let meta = unwrap(defaultExport);
  if (meta?.type === "Identifier") {
    context.metaName = meta.name;
    const declaration = context.declarations.get(meta.name);
    const declarator =
      declaration?.type === "VariableDeclaration"
        ? declaration.declarations.find(
            (item) => item.id.type === "Identifier" && item.id.name === context.metaName,
          )
        : undefined;
    meta = unwrap(declarator?.init);
  }
  const metaObject = asObject(meta);
  const component = unwrap(propertyValue(metaObject, "component"));
  if (component?.type === "Identifier") context.metaComponent = component.name;
  context.metaArgs = asObject(propertyValue(metaObject, "args"));
  context.metaRender = propertyValue(metaObject, "render");

  return { context, stories };
}

function isEmptyValue(node: Node) {
  const value = unwrap(node);
  return (
    value?.type === "NullLiteral" || (value?.type === "Identifier" && value.name === "undefined")
  );
}

/**
 * The meta's args merged with the story's. Meta args set to `false` are control
 * defaults (the prop's own default), and a story that resets an arg to
 * `null`/`undefined` means "without it", so neither becomes a prop.
 */
function collectArgs(meta: t.ObjectExpression | null, story: t.ObjectExpression | null) {
  const args = new Map<string, Arg>();
  for (const [object, isMeta] of [
    [meta, true],
    [story, false],
  ] as const) {
    if (!object) continue;
    for (const property of object.properties) {
      if (property.type !== "ObjectProperty") continue;
      const key = propertyKey(property);
      if (key === null) continue;
      const value = property.value as t.Expression;
      const unwrapped = unwrap(value);
      if (isMeta && unwrapped?.type === "BooleanLiteral" && !unwrapped.value) continue;
      if (!isMeta && isEmptyValue(value) && args.has(key)) {
        args.delete(key);
        continue;
      }
      args.set(key, { node: value, spy: isSpy(value) });
    }
  }
  return args;
}

function jsxAttribute(opening: t.JSXOpeningElement, name: string) {
  return opening.attributes.find(
    (attribute): attribute is t.JSXAttribute =>
      attribute.type === "JSXAttribute" &&
      attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === name,
  );
}

function isTestReadout(opening: t.JSXOpeningElement) {
  const className = jsxAttribute(opening, "className")?.value;
  return (
    jsxAttribute(opening, "data-testid") !== undefined &&
    className?.type === "StringLiteral" &&
    className.value.split(/\s+/).includes("sr-only")
  );
}

/**
 * `render: () => <TreeDemo />`: a story that only mounts a local component
 * without props. That component is the example, under the example's name.
 */
function soleComponent(context: StoryFile, render: ReturnType<typeof resolveRender>) {
  if (!render || render.params.length > 0) return undefined;
  let element: Node | null | undefined = render.body;
  if (element?.type === "BlockStatement") {
    const [statement, ...rest] = element.body;
    element =
      rest.length === 0 && statement?.type === "ReturnStatement" ? statement.argument : null;
  }
  element = unwrap(element);
  if (
    element?.type !== "JSXElement" ||
    element.openingElement.attributes.length > 0 ||
    element.openingElement.name.type !== "JSXIdentifier"
  ) {
    return undefined;
  }
  const declaration = context.declarations.get(element.openingElement.name.name);
  return declaration?.type === "FunctionDeclaration" && declaration.params.length === 0
    ? declaration
    : undefined;
}

class SnippetBuilder {
  private edits: Edit[] = [];

  constructor(
    private readonly context: StoryFile,
    private readonly args: Map<string, Arg>,
    private readonly argsName: string | null,
    private readonly locals: Map<string, string>,
    private readonly spies: Set<string>,
  ) {}

  private text(node: Node) {
    return this.context.file.slice(node.start ?? 0, node.end ?? 0);
  }

  /** Start of the whitespace before `position`, so a removal takes its separator along. */
  private withLeadingSpace(position: number) {
    let start = position;
    while (start > 0 && /\s/.test(this.context.file[start - 1] ?? "")) start--;
    return start;
  }

  private remove(node: Node) {
    this.edits.push({
      start: this.withLeadingSpace(node.start ?? 0),
      end: node.end ?? 0,
      text: "",
    });
  }

  private replace(node: Node, text: string) {
    this.edits.push({ start: node.start ?? 0, end: node.end ?? 0, text });
  }

  private usable(key: string) {
    const arg = this.args.get(key);
    return arg && !arg.spy && !isEmptyValue(arg.node) ? arg : undefined;
  }

  /** `key="value"`, `key` or `key={value}`. */
  attribute(key: string, arg: Arg) {
    const value = unwrap(arg.node);
    if (value?.type === "StringLiteral" && !/["\n\\]/.test(value.value)) {
      return `${key}="${value.value}"`;
    }
    if (value?.type === "BooleanLiteral" && value.value) return key;
    return `${key}={${this.text(arg.node)}}`;
  }

  children(arg: Arg) {
    const value = unwrap(arg.node);
    if (value?.type === "StringLiteral" && !/[{}<>\n]/.test(value.value)) return value.value;
    if (value?.type === "JSXFragment") {
      return this.context.file.slice(
        value.openingFragment.end ?? 0,
        value.closingFragment.start ?? 0,
      );
    }
    if (value?.type === "JSXElement") return this.text(value);
    return `{${this.text(arg.node)}}`;
  }

  /** The args as attributes, minus the ones an element sets itself. */
  attributes(skip: Set<string>) {
    const attributes: string[] = [];
    for (const [key, arg] of this.args) {
      if (arg.spy || key === "children" || skip.has(key)) continue;
      const value = unwrap(arg.node);
      if (isEmptyValue(arg.node)) continue;
      // cva's `default` variants are what you get without the prop.
      if (value?.type === "StringLiteral" && value.value === "default") continue;
      attributes.push(this.attribute(key, arg));
    }
    return attributes;
  }

  /** `<Component {...args} />` for a story without a render of its own. */
  element(component: string) {
    const open = [component, ...this.attributes(new Set())].join(" ");
    const children = this.usable("children");
    return children ? `<${open}>${this.children(children)}</${component}>` : `<${open} />`;
  }

  /** A reference to a top-level `const spy = fn()`. */
  private isSpyReference(node: Node, parent: Node | null, key: string) {
    return node.type === "Identifier" && this.spies.has(node.name) && isReference(parent, key);
  }

  private argKey(node: Node, parent: Node | null, key: string): string | null {
    if (
      (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") &&
      node.object.type === "Identifier" &&
      node.object.name === this.argsName &&
      !node.computed &&
      node.property.type === "Identifier"
    ) {
      return node.property.name;
    }
    if (node.type === "Identifier" && isReference(parent, key)) {
      return this.locals.get(node.name) ?? null;
    }
    return null;
  }

  private spread(node: t.JSXSpreadAttribute, opening: t.JSXOpeningElement, element: Node | null) {
    const skip = new Set<string>();
    for (const attribute of opening.attributes) {
      if (attribute.type !== "JSXAttribute") continue;
      const name =
        attribute.name.type === "JSXIdentifier"
          ? attribute.name.name
          : `${attribute.name.namespace.name}:${attribute.name.name.name}`;
      skip.add(name);
      // A controlled prop (`value`, `isOpen`) makes the args' `defaultValue`/`defaultOpen` moot.
      const base = name.replace(/^is(?=[A-Z])/, "");
      skip.add(`default${base[0]?.toUpperCase()}${base.slice(1)}`);
    }
    const hasChildren =
      element?.type === "JSXElement" &&
      element.children.some((child) => child.type !== "JSXText" || child.value.trim() !== "");
    // Layout is left to the formatter (formatSnippets).
    const attributes = this.attributes(skip);
    if (attributes.length === 0) this.remove(node);
    else this.replace(node, attributes.join(" "));

    const children = this.usable("children");
    if (!children || hasChildren || !opening.selfClosing) return;
    const last = opening.attributes.at(-1) ?? opening.name;
    const tag = this.text(opening.name);
    this.edits.push({
      start: last.end ?? 0,
      end: opening.end ?? 0,
      text: `>${this.children(children)}</${tag}>`,
    });
  }

  /** Collects the edits that turn the render's code into plain component code. */
  rewrite(root: Node) {
    walk(root, (node, parent, key, grandparent) => {
      // An invisible element the play function reads (`<output data-testid sr-only>`).
      if (node.type === "JSXElement" && isTestReadout(node.openingElement)) {
        this.remove(node);
        return false;
      }
      // Test hooks for the play function, and props reset to `undefined`, aren't part of the example.
      if (
        node.type === "JSXAttribute" &&
        ((node.name.type === "JSXIdentifier" && node.name.name === "data-testid") ||
          (node.value?.type === "JSXExpressionContainer" &&
            node.value.expression.type === "Identifier" &&
            node.value.expression.name === "undefined"))
      ) {
        this.remove(node);
        return false;
      }
      if (
        node.type === "JSXSpreadAttribute" &&
        node.argument.type === "Identifier" &&
        node.argument.name === this.argsName &&
        parent?.type === "JSXOpeningElement"
      ) {
        this.spread(node, parent, grandparent);
        return false;
      }
      if (
        node.type === "SpreadElement" &&
        node.argument.type === "Identifier" &&
        node.argument.name === this.argsName &&
        parent?.type === "ObjectExpression"
      ) {
        const skip = new Set(
          parent.properties.flatMap((property) =>
            property.type === "SpreadElement" ? [] : [propertyKey(property) ?? ""],
          ),
        );
        const properties = [...this.args]
          .filter(([name, arg]) => !arg.spy && !skip.has(name))
          .map(
            ([name, arg]) =>
              `${/^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name)}: ${this.text(arg.node)}`,
          );
        if (properties.length === 0) this.remove(node);
        else this.replace(node, properties.join(", "));
        return false;
      }
      const spy = this.isSpyReference(node, parent, key);
      const argKey = spy ? null : this.argKey(node, parent, key);
      if (argKey === null && !spy) return;
      const arg = argKey === null ? undefined : this.usable(argKey);
      if (!arg) {
        // A spy or an unset arg: drop the prop or call that only fed the story.
        if (parent?.type === "JSXExpressionContainer" && grandparent?.type === "JSXAttribute") {
          this.remove(grandparent);
        } else if (
          (parent?.type === "CallExpression" || parent?.type === "OptionalCallExpression") &&
          key === "callee"
        ) {
          this.replace(parent, "undefined");
          this.dropStatement(root, parent);
        } else {
          const isSpyArg = spy || (argKey !== null && this.args.get(argKey)?.spy);
          this.replace(node, isSpyArg ? "() => {}" : "undefined");
        }
        return false;
      }
      const value = unwrap(arg.node);
      if (
        parent?.type === "JSXExpressionContainer" &&
        grandparent?.type === "JSXAttribute" &&
        value?.type === "BooleanLiteral" &&
        value.value
      ) {
        this.edits.push({ start: grandparent.name.end ?? 0, end: grandparent.end ?? 0, text: "" });
      } else if (
        parent?.type === "JSXExpressionContainer" &&
        grandparent?.type === "JSXAttribute" &&
        value?.type === "StringLiteral" &&
        !/["\n\\]/.test(value.value)
      ) {
        this.replace(parent, `"${value.value}"`);
      } else {
        const simple =
          value &&
          /^(Identifier|StringLiteral|NumericLiteral|BooleanLiteral|NullLiteral|TemplateLiteral|ArrayExpression|ObjectExpression|CallExpression|MemberExpression|NewExpression|JSXElement|JSXFragment)$/.test(
            value.type,
          );
        this.replace(node, simple ? this.text(arg.node) : `(${this.text(arg.node)})`);
      }
      return false;
    });
  }

  /** A statement that was only a spy call (`args.onChange?.(value);`) goes away whole. */
  private dropStatement(root: Node, call: Node) {
    walk(root, (node) => {
      if (node.type === "ExpressionStatement" && node.expression === call) {
        this.edits = this.edits.filter((edit) => edit.start !== call.start);
        this.remove(node);
        return false;
      }
    });
  }

  /** The file's text between `start` and `end`, with the collected edits applied. */
  apply(start: number, end: number) {
    const edits = this.edits
      .filter((edit) => edit.start >= start && edit.end <= end)
      .sort((a, b) => b.start - a.start || b.end - a.end);
    let text = this.context.file.slice(start, end);
    let floor = Number.POSITIVE_INFINITY;
    for (const edit of edits) {
      if (edit.end > floor) continue; // nested in an edit already applied
      text = text.slice(0, edit.start - start) + edit.text + text.slice(edit.end - start);
      floor = edit.start;
    }
    return text;
  }
}

function functionBody(node: Node | null | undefined) {
  const value = unwrap(node);
  if (
    value?.type === "ArrowFunctionExpression" ||
    value?.type === "FunctionExpression" ||
    value?.type === "ObjectMethod"
  ) {
    return value;
  }
  return undefined;
}

/** Leading comments are part of a declaration: they say why it's shaped that way. */
function declarationStart(statement: t.Statement) {
  return statement.leadingComments?.[0]?.start ?? statement.start ?? 0;
}

/**
 * The story object: an object literal, or the one a story factory takes
 * (`rangeStory({ ... })`, a typed helper that returns it).
 */
function storyObject(init: Node) {
  const value = unwrap(init);
  if (value?.type === "CallExpression" && value.arguments.length === 1) {
    return asObject(value.arguments[0]);
  }
  return asObject(value);
}

/** Tagged out of the docs (`!autodocs`, `!dev`): regression tests, not examples. */
function isHidden(story: t.ObjectExpression | null) {
  const tags = unwrap(propertyValue(story, "tags"));
  return (
    tags?.type === "ArrayExpression" &&
    tags.elements.some(
      (tag) => tag?.type === "StringLiteral" && (tag.value === "!autodocs" || tag.value === "!dev"),
    )
  );
}

/** A render given by reference (`render: renderRangeField`) resolves to its declaration. */
function resolveRender(context: StoryFile, node: Node | undefined) {
  const value = unwrap(node);
  if (value?.type !== "Identifier") return functionBody(value ?? undefined);
  const declaration = context.declarations.get(value.name);
  if (declaration?.type === "FunctionDeclaration") return declaration;
  if (declaration?.type === "VariableDeclaration") {
    const declarator = declaration.declarations.find(
      (item) => item.id.type === "Identifier" && item.id.name === value.name,
    );
    return functionBody(declarator?.init ?? undefined);
  }
  return undefined;
}

/** A declaration's text with the render's clean-up (test hooks, spies), and no args to resolve. */
function cleanDeclaration(context: StoryFile, statement: t.Statement) {
  const cleaner = new SnippetBuilder(context, new Map(), null, new Map(), context.spies);
  cleaner.rewrite(statement);
  return cleaner.apply(declarationStart(statement), statement.end ?? 0);
}

function storySnippet(context: StoryFile, exportName: string, story: t.ObjectExpression | null) {
  const override = staticString(
    propertyValue(
      asObject(
        propertyValue(
          asObject(propertyValue(asObject(propertyValue(story, "parameters")), "docs")),
          "source",
        ),
      ),
      "code",
    ),
  );
  if (override !== undefined) return override.trim();

  const args = collectArgs(context.metaArgs, asObject(propertyValue(story, "args")));
  const render = resolveRender(context, propertyValue(story, "render") ?? context.metaRender);
  const param = render?.params[0];
  let argsName: string | null = null;
  const locals = new Map<string, string>();
  if (param?.type === "Identifier") argsName = param.name;
  else if (param?.type === "ObjectPattern") {
    for (const property of param.properties) {
      if (property.type === "RestElement" && property.argument.type === "Identifier") {
        argsName = property.argument.name;
      } else if (property.type === "ObjectProperty") {
        const key = propertyKey(property);
        if (key && property.value.type === "Identifier") locals.set(property.value.name, key);
      }
    }
  }
  const builder = new SnippetBuilder(context, args, argsName, locals, context.spies);

  let body: string;
  if (!render) {
    const component = context.metaComponent;
    if (!component) return "";
    body = `  return ${builder.element(component)};`;
  } else if (render.body.type === "BlockStatement") {
    const statements = render.body.body;
    const first = statements[0];
    const last = statements.at(-1);
    if (!first || !last) return "";
    builder.rewrite(render.body);
    body = `  ${builder.apply(declarationStart(first), last.end ?? 0)}`;
  } else {
    const expression = render.body;
    builder.rewrite(expression);
    const text = builder.apply(expression.start ?? 0, expression.end ?? 0);
    body = text.includes("\n") ? `  return (\n    ${text}\n  );` : `  return ${text};`;
  }

  const base = pascal(context.name);
  let functionName =
    exportName === "Default"
      ? `${base}Demo`
      : exportName.startsWith(base)
        ? exportName
        : `${base}${exportName}`;
  // `AvatarGroup` the story would shadow `AvatarGroup` the component.
  const taken = new Set([
    ...context.declarations.keys(),
    ...context.imports.flatMap((item) => item.specifiers.map((specifier) => specifier.local.name)),
  ]);
  if (taken.has(functionName)) functionName = `${functionName}Demo`;
  const excluded = new Set([...STORY_ONLY_NAMES, ...(context.metaName ? [context.metaName] : [])]);
  let demo = `export function ${functionName}() {\n${body}\n}`;
  const sole = soleComponent(context, render);
  if (sole?.id) {
    excluded.add(sole.id.name);
    demo = cleanDeclaration(context, sole).replace(
      `function ${sole.id.name}(`,
      `export function ${functionName}(`,
    );
  }

  // The file's own declarations the example uses, transitively, in file order.
  const names = referencedNames(parseModule(demo).program);
  const included = new Set<t.Statement>();
  const queue = [...names];
  while (queue.length > 0) {
    const name = queue.pop() as string;
    const declaration = context.declarations.get(name);
    if (!declaration || excluded.has(name) || included.has(declaration)) continue;
    included.add(declaration);
    for (const reference of referencedNames(declaration)) {
      names.add(reference);
      queue.push(reference);
    }
  }
  const declarations = [...included]
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    .map((statement) => cleanDeclaration(context, statement));

  const imports: string[] = [];
  for (const declaration of context.imports) {
    const source = declaration.source.value;
    if (STORY_ONLY_SOURCE.test(source)) continue;
    const used = declaration.specifiers.filter(
      (specifier) => names.has(specifier.local.name) && !excluded.has(specifier.local.name),
    );
    if (used.length === 0) continue;
    const typeOnly = declaration.importKind === "type" ? "type " : "";
    const target = installedImport(source, context.name, context.kind);
    const parts: string[] = [];
    const named: string[] = [];
    for (const specifier of used) {
      if (specifier.type === "ImportDefaultSpecifier") parts.push(specifier.local.name);
      else if (specifier.type === "ImportNamespaceSpecifier")
        parts.push(`* as ${specifier.local.name}`);
      else {
        const imported =
          specifier.imported.type === "Identifier"
            ? specifier.imported.name
            : specifier.imported.value;
        const kind = specifier.importKind === "type" ? "type " : "";
        named.push(
          imported === specifier.local.name
            ? `${kind}${imported}`
            : `${kind}${imported} as ${specifier.local.name}`,
        );
      }
    }
    if (named.length > 0) parts.push(`{ ${named.join(", ")} }`);
    imports.push(`import ${typeOnly}${parts.join(", ")} from "${target}";`);
  }

  return [imports.join("\n"), ...declarations, demo].filter(Boolean).join("\n\n");
}

/**
 * Every docs story's example code, keyed by export name in the file's order.
 * Stories hidden from the docs are left out; one that renders nothing copyable
 * (no render and no meta component) maps to an empty string.
 */
export function storySnippets(file: string, name: string, kind: SnippetKind) {
  const { context, stories } = readStoryFile(file, name, kind);
  const snippets: Record<string, string> = {};
  for (const { exportName, node } of stories) {
    const story = storyObject(node);
    if (isHidden(story)) continue;
    snippets[exportName] = storySnippet(context, exportName, story);
  }
  return snippets;
}

const ROOT = resolve(import.meta.dirname, "../../..");

/**
 * Formats snippets with the repo's Biome config, in one process for all of them.
 * Generated code keeps the story's line breaks, which no longer fit once
 * `{...args}` is spelled out. A snippet Biome can't parse stays as it was.
 */
export function formatSnippets(snippets: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "fma-ui-snippets-"));
  const entries = Object.entries(snippets);
  try {
    entries.forEach(([, code], index) => {
      writeFileSync(join(dir, `${index}.tsx`), code);
    });
    try {
      execFileSync(
        join(ROOT, "node_modules/.bin/biome"),
        // `check` without the linter: formatting plus the import sorting assist.
        [
          "check",
          "--write",
          "--linter-enabled=false",
          // The temp dir is outside the repo; Biome 2.5.15 panics on the VCS ignore file there.
          "--vcs-enabled=false",
          `--config-path=${join(ROOT, "biome.json")}`,
          dir,
        ],
        { stdio: "ignore" },
      );
    } catch {
      // Exits non-zero when a file doesn't parse; the others are formatted anyway.
    }
    return Object.fromEntries(
      entries.map(([name], index) => [
        name,
        readFileSync(join(dir, `${index}.tsx`), "utf8").trimEnd(),
      ]),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
