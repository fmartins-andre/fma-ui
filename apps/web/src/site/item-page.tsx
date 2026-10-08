import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-aria-components";
import { Badge } from "@/core/badge/badge";
import { LinkButton } from "@/core/button/button";
import { Skeleton } from "@/core/skeleton/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/tabs/tabs";
import { CodeBlock } from "./code-block";
import { InlineMarkdown } from "./markdown";
import {
  categoryTitle,
  type ItemKind,
  installCommand,
  neighbors,
  packageName,
  REGISTRIES_SNIPPET,
  type RegistryItem,
  registryDependencyLink,
  STORYBOOK_URL,
} from "./registry";
import { type DocStories, loadSource, loadStories } from "./stories";
import { StoryPreview } from "./story-preview";

const KIND_TITLE: Record<ItemKind, string> = { components: "Components", blocks: "Blocks" };

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function useStories(kind: ItemKind, name: string) {
  const [state, setState] = useState<{ name: string; stories: DocStories | null } | null>(null);
  useEffect(() => {
    let active = true;
    void loadStories(kind, name).then((stories) => active && setState({ name, stories }));
    return () => {
      active = false;
    };
  }, [kind, name]);
  return state?.name === name ? state : null;
}

function useSources(item: RegistryItem) {
  const [sources, setSources] = useState<{ name: string; files: string[] } | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all(item.files.map((file) => loadSource(file.path).catch(() => ""))).then(
      (files) => active && setSources({ name: item.name, files }),
    );
    return () => {
      active = false;
    };
  }, [item]);
  return sources?.name === item.name ? sources.files : null;
}

function H2({ children }: { children: string }) {
  return (
    <h2
      id={slug(children)}
      className="mt-12 scroll-m-20 border-b pb-2 font-heading text-xl font-semibold tracking-tight"
    >
      {children}
    </h2>
  );
}

function Step({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative flex flex-col gap-3 border-l pb-8 pl-8 last:pb-0">
      <span className="absolute -left-3.5 grid size-7 place-items-center rounded-full border bg-background font-mono text-xs font-medium">
        {index}
      </span>
      <h3 className="font-medium leading-7">{title}</h3>
      {children}
    </li>
  );
}

function Installation({ item }: { item: RegistryItem }) {
  const sources = useSources(item);
  const npm = (item.dependencies ?? []).map(packageName);
  const registryDeps = item.registryDependencies ?? [];
  let step = 0;
  return (
    <Tabs defaultSelectedKey="cli" className="mt-4 gap-4">
      <TabsList variant="line" aria-label="Installation method">
        <TabsTrigger id="cli">CLI</TabsTrigger>
        <TabsTrigger id="manual">Manual</TabsTrigger>
      </TabsList>
      <TabsContent id="cli">
        <ol className="ml-3.5">
          <Step index={1} title="Register the @fma-ui namespace in components.json (once)">
            <CodeBlock code={REGISTRIES_SNIPPET} lang="json" title="components.json" />
          </Step>
          <Step index={2} title="Add the item">
            <CodeBlock code={installCommand(item.name)} lang="bash" />
            <p className="text-sm text-muted-foreground">
              Files land in <code className="font-mono">{item.files[0]?.target}</code>
              {item.files.length > 1 && ` and ${item.files.length - 1} more`}; npm and registry
              dependencies are installed along with them.
            </p>
          </Step>
        </ol>
      </TabsContent>
      <TabsContent id="manual">
        <ol className="ml-3.5">
          {npm.length > 0 && (
            <Step index={++step} title="Install the npm dependencies">
              <CodeBlock code={`pnpm add ${npm.join(" ")}`} lang="bash" />
            </Step>
          )}
          {registryDeps.length > 0 && (
            <Step index={++step} title="Add the registry items it builds on">
              <ul className="flex flex-wrap gap-2">
                {registryDeps.map((dependency) => {
                  const link = registryDependencyLink(dependency);
                  return (
                    <li key={dependency}>
                      {link ? (
                        <Link href={`/${link.kind}/${link.name}`}>
                          <Badge variant="outline">{dependency}</Badge>
                        </Link>
                      ) : (
                        <Badge variant="outline">{dependency}</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Step>
          )}
          <Step index={++step} title="Copy the source into your project">
            {item.files.map((file, index) =>
              sources ? (
                <CodeBlock
                  key={file.path}
                  title={file.target}
                  code={sources[index] ?? ""}
                  lang={file.path.endsWith(".tsx") ? "tsx" : "ts"}
                  className="max-h-[480px] overflow-y-auto"
                />
              ) : (
                <Skeleton key={file.path} className="h-48 w-full rounded-xl" />
              ),
            )}
          </Step>
          <Step index={++step} title="Update the import paths to match your project setup">
            <p className="text-sm text-muted-foreground">
              Sources import siblings as{" "}
              <code className="font-mono">@/core/&lt;name&gt;/&lt;name&gt;</code>; the CLI rewrites
              these for you.
            </p>
          </Step>
        </ol>
      </TabsContent>
    </Tabs>
  );
}

function Pager({ kind, name }: { kind: ItemKind; name: string }) {
  const { previous, next } = neighbors(kind, name);
  return (
    <nav aria-label="Pager" className="mt-16 flex items-center justify-between gap-4">
      {previous ? (
        <LinkButton href={`/${kind}/${previous.name}`} variant="secondary">
          <ArrowLeftIcon data-icon="inline-start" />
          {previous.title}
        </LinkButton>
      ) : (
        <span />
      )}
      {next && (
        <LinkButton href={`/${kind}/${next.name}`} variant="secondary">
          {next.title}
          <ArrowRightIcon data-icon="inline-end" />
        </LinkButton>
      )}
    </nav>
  );
}

function Toc({ headings }: { headings: string[] }) {
  return (
    <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] w-56 shrink-0 overflow-y-auto xl:block">
      <p className="mb-2 text-sm font-medium">On this page</p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {headings.map((heading) => (
          <li key={heading}>
            <a href={`#${slug(heading)}`} className="text-muted-foreground hover:text-foreground">
              {heading}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function ItemPage({ kind, item }: { kind: ItemKind; item: RegistryItem }) {
  const loaded = useStories(kind, item.name);
  const stories = loaded?.stories?.stories ?? [];
  const [first, ...rest] = stories;
  const examples = rest.filter((story) => story.isExample);
  const headings = ["Installation", ...(examples.length ? ["Examples"] : []), "Dependencies"];

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1 pb-12">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${kind}`} className="hover:text-foreground">
            {KIND_TITLE[kind]}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{item.title}</span>
        </nav>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">{item.title}</h1>
        <p className="mt-2 text-base text-balance text-muted-foreground">
          <InlineMarkdown text={item.description} />
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {item.categories?.[0] && kind === "components" && (
            <Badge variant="secondary">{categoryTitle(item.categories[0])}</Badge>
          )}
          <Badge variant="outline">{item.meta.source}</Badge>
          {item.meta.status !== "stable" && (
            <Badge variant="warning-light">{item.meta.status}</Badge>
          )}
          <span className="flex-1" />
          {loaded?.stories && (
            <LinkButton
              href={`${STORYBOOK_URL}?path=/docs/${loaded.stories.docsId}`}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              size="sm"
            >
              Storybook
              <ArrowUpRightIcon data-icon="inline-end" />
            </LinkButton>
          )}
          <LinkButton href={`/r/${item.name}.json`} target="_blank" variant="outline" size="sm">
            Registry JSON
            <ArrowUpRightIcon data-icon="inline-end" />
          </LinkButton>
        </div>

        <div className="mt-8">
          {!loaded ? (
            <Skeleton className="h-[400px] w-full rounded-xl" />
          ) : first ? (
            <StoryPreview kind={kind} name={item.name} story={first} />
          ) : (
            <p className="text-sm text-muted-foreground">No preview available.</p>
          )}
        </div>

        <H2>Installation</H2>
        <Installation item={item} />

        {examples.length > 0 && (
          <>
            <H2>Examples</H2>
            {examples.map((story) => (
              <section key={story.exportName} className="mt-8">
                <h3
                  id={`example-${slug(story.exportName)}`}
                  className="scroll-m-20 font-heading text-lg font-semibold tracking-tight"
                >
                  {story.name}
                </h3>
                {story.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <InlineMarkdown text={story.description} />
                  </p>
                )}
                <StoryPreview kind={kind} name={item.name} story={story} className="mt-4" />
              </section>
            ))}
          </>
        )}

        <H2>Dependencies</H2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">npm</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {(item.dependencies ?? []).length === 0 && (
                <span className="text-muted-foreground">None</span>
              )}
              {(item.dependencies ?? []).map((dependency) => (
                <Badge key={dependency} variant="secondary" className="font-mono">
                  {dependency}
                </Badge>
              ))}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Registry</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {(item.registryDependencies ?? []).length === 0 && (
                <span className="text-muted-foreground">None</span>
              )}
              {(item.registryDependencies ?? []).map((dependency) => {
                const link = registryDependencyLink(dependency);
                return link ? (
                  <Link key={dependency} href={`/${link.kind}/${link.name}`}>
                    <Badge variant="outline" className="font-mono hover:bg-accent">
                      {dependency}
                    </Badge>
                  </Link>
                ) : (
                  <Badge key={dependency} variant="outline" className="font-mono">
                    {dependency}
                  </Badge>
                );
              })}
            </dd>
          </div>
        </dl>

        <Pager kind={kind} name={item.name} />
      </article>
      <Toc headings={headings} />
    </div>
  );
}
