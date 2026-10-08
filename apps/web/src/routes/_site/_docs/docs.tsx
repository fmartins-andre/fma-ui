import { createFileRoute } from "@tanstack/react-router";
import { LinkButton } from "@/core/button/button";
import { CodeBlock } from "../../../site/code-block";
import {
  BLOCKS,
  COMPONENTS,
  installCommand,
  REGISTRIES_SNIPPET,
  STORYBOOK_URL,
  THEME_COUNT,
} from "../../../site/registry";

export const Route = createFileRoute("/_site/_docs/docs")({
  head: () => ({ meta: [{ title: "Introduction · fma-ui" }] }),
  component: DocsIntroduction,
});

function H2({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="mt-12 scroll-m-20 border-b pb-2 font-heading text-xl font-semibold tracking-tight"
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 leading-7 text-foreground/90">{children}</p>;
}

function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
  );
}

function DocsIntroduction() {
  return (
    <article className="max-w-3xl pb-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Introduction</h1>
      <p className="mt-2 text-base text-muted-foreground">
        A personal component registry in the shadcn/ui format: {COMPONENTS.length} components,{" "}
        {BLOCKS.length} blocks and {THEME_COUNT} themes, built on react-aria-components.
      </p>

      <P>
        This is not a package you install from npm. Like shadcn/ui, the code is copied into your
        project by the <C>shadcn</C> CLI, and from then on it is yours. Everything lands in{" "}
        <C>fma-ui</C> folders (<C>components/fma-ui/</C>, <C>hooks/fma-ui/</C>, <C>lib/fma-ui/</C>
        ), so it never collides with the official shadcn components.
      </P>

      <H2 id="installation">Installation</H2>
      <P>
        Start from a project set up for shadcn/ui (Tailwind v4, a <C>components.json</C>). Then
        register the <C>@fma-ui</C> namespace:
      </P>
      <CodeBlock className="mt-4" code={REGISTRIES_SNIPPET} lang="json" title="components.json" />
      <P>And add any component or block by name:</P>
      <CodeBlock className="mt-4" code={installCommand("button")} lang="bash" />
      <P>
        Dependencies between items resolve through the same namespace, so adding a block pulls the
        components it is built from.
      </P>

      <H2 id="react-aria">Built on React Aria</H2>
      <P>
        Interaction, focus management and accessibility come from react-aria-components, so the APIs
        follow React Aria rather than Radix: <C>isDisabled</C> instead of <C>disabled</C>,{" "}
        <C>onPress</C> instead of <C>onClick</C>, and no <C>asChild</C> (use <C>LinkButton</C> for a
        link that looks like a button). Wrap your app in React Aria's <C>RouterProvider</C> so links
        navigate client-side.
      </P>

      <H2 id="themes">Themes</H2>
      <P>
        Every color, radius, font and shadow is a CSS variable. Pick one of the curated themes,
        tweak it in the theme editor and export it as CSS, or install it straight from the registry
        with <C>@fma-ui/theme-&lt;name&gt;</C>.
      </P>
      <div className="mt-4">
        <LinkButton href="/themes" variant="outline">
          Open the theme editor
        </LinkButton>
      </div>

      <H2 id="storybook">Storybook</H2>
      <P>
        Every component has stories with interaction tests; the examples on these pages are those
        same stories. Storybook also documents props and shows the accessibility checks.
      </P>
      <div className="mt-4">
        <LinkButton href={STORYBOOK_URL} target="_blank" rel="noreferrer" variant="outline">
          Open Storybook
        </LinkButton>
      </div>
    </article>
  );
}
