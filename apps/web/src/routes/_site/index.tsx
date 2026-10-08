import { createFileRoute } from "@tanstack/react-router";
import {
  AccessibilityIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BoxesIcon,
  PaletteIcon,
  TerminalIcon,
} from "lucide-react";
import { Link } from "react-aria-components";
import { Badge } from "@/core/badge/badge";
import { LinkButton } from "@/core/button/button";
import { CodeBlock } from "../../site/code-block";
import {
  BLOCKS,
  COMPONENTS,
  componentsByCategory,
  installCommand,
  STORYBOOK_URL,
  THEME_COUNT,
} from "../../site/registry";
import { Showcase } from "../../theme-editor/showcase";

export const Route = createFileRoute("/_site/")({
  component: Home,
});

const FEATURES = [
  {
    icon: AccessibilityIcon,
    title: "Accessible by default",
    text: "Built on react-aria-components: keyboard, focus and screen reader behavior come for free.",
  },
  {
    icon: TerminalIcon,
    title: "shadcn CLI compatible",
    text: "Install with shadcn add @fma-ui/<name>. The code is copied into your project — it's yours.",
  },
  {
    icon: PaletteIcon,
    title: "Themeable",
    text: "Every token is a CSS variable. Pick a curated theme or build your own in the editor.",
  },
  {
    icon: BookOpenIcon,
    title: "Tested in Storybook",
    text: "Each component ships with stories and interaction tests; they are the examples here too.",
  },
];

function Home() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
      <section className="flex flex-col items-center gap-4 py-16 text-center md:py-24">
        <Link href="/blocks" className="outline-none">
          <Badge variant="secondary" className="gap-1">
            {COMPONENTS.length} components · {BLOCKS.length} blocks · {THEME_COUNT} themes
            <ArrowRightIcon />
          </Badge>
        </Link>
        <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance md:text-6xl">
          Accessible components for your shadcn project
        </h1>
        <p className="max-w-2xl text-lg text-balance text-muted-foreground">
          A registry of react-aria components, blocks and themes in the shadcn/ui format. Copy them
          into your app with the CLI, then make them yours.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <LinkButton href="/docs" size="lg">
            Get started
          </LinkButton>
          <LinkButton href="/components" size="lg" variant="outline">
            Browse components
          </LinkButton>
          <LinkButton href="/themes" size="lg" variant="ghost">
            Theme editor
          </LinkButton>
        </div>
        <CodeBlock
          className="mt-4 w-full max-w-md text-left"
          code={installCommand("button")}
          lang="bash"
        />
      </section>

      <section aria-label="Showcase" className="rounded-2xl border bg-muted/40 p-4 md:p-6">
        <Showcase />
      </section>

      <section aria-labelledby="features" className="py-16">
        <h2 id="features" className="sr-only">
          Features
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-2">
              <span className="grid size-9 place-items-center rounded-lg border bg-card">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="browse" className="pb-16">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-3">
          <h2 id="browse" className="font-heading text-2xl font-semibold tracking-tight">
            Browse the registry
          </h2>
          <div className="flex gap-2">
            <LinkButton href="/blocks" variant="outline" size="sm">
              <BoxesIcon data-icon="inline-start" />
              Blocks
            </LinkButton>
            <LinkButton
              href={STORYBOOK_URL}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              size="sm"
            >
              Storybook
            </LinkButton>
          </div>
        </div>
        <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {componentsByCategory().map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-medium">{group.title}</h3>
              <ul className="mt-2 flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={`/components/${item.name}`}
                      className="text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
