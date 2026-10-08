import { ArrowUpRightIcon } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/tabs/tabs";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import type { ItemKind } from "./registry";
import { STORYBOOK_URL } from "./registry";
import type { DocStory } from "./stories";

class PreviewBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <p className="text-sm text-destructive">
          This example failed to render: {this.state.error.message}
        </p>
      );
    }
    return this.props.children;
  }
}

export function previewPath(kind: ItemKind, name: string, story: string) {
  return `/preview/${kind}/${name}/${story}`;
}

export function storybookStoryUrl(id: string) {
  return `${STORYBOOK_URL}?path=/story/${id}`;
}

/**
 * One story, as shadcn's docs show an example: the live preview, and its code
 * in a second tab. Fullscreen stories (app shells, toasters) get an iframe, so
 * their fixed positioning stays inside the frame instead of over the page.
 */
export function StoryPreview({
  kind,
  name,
  story,
  className,
}: {
  kind: ItemKind;
  name: string;
  story: DocStory;
  className?: string;
}) {
  const framed = kind === "blocks" || story.layout === "fullscreen";
  const { Component: Story } = story;
  return (
    <Tabs className={cn("gap-3", className)} defaultSelectedKey="preview">
      <div className="flex items-center justify-between gap-2">
        <TabsList variant="line" aria-label={`${story.name} example`}>
          <TabsTrigger id="preview">Preview</TabsTrigger>
          <TabsTrigger id="code">Code</TabsTrigger>
        </TabsList>
        <a
          href={framed ? previewPath(kind, name, story.exportName) : storybookStoryUrl(story.id)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {framed ? "Open in new tab" : "Open in Storybook"}
          <ArrowUpRightIcon className="size-3" aria-hidden="true" />
        </a>
      </div>
      <TabsContent id="preview">
        {framed ? (
          <iframe
            title={`${story.name} preview`}
            src={previewPath(kind, name, story.exportName)}
            className="h-[640px] w-full rounded-xl border bg-background"
            loading="lazy"
          />
        ) : (
          <div
            data-slot="story-preview"
            className={cn(
              "flex min-h-[350px] w-full overflow-x-auto rounded-xl border bg-background p-6 md:p-10",
              story.layout === "centered" && "items-center justify-center",
            )}
          >
            <div className={cn(story.layout === "centered" ? "max-w-full" : "w-full")}>
              <PreviewBoundary>
                <Story />
              </PreviewBoundary>
            </div>
          </div>
        )}
      </TabsContent>
      <TabsContent id="code">
        <CodeBlock code={story.code} className="max-h-[640px] overflow-y-auto" />
      </TabsContent>
    </Tabs>
  );
}
