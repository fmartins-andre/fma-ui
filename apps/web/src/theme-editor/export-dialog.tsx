import { Check, Copy, Download } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/core/button/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/dialog/dialog";
import { Input } from "@/core/input/input";
import { Label } from "@/core/label/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/tabs/tabs";
import {
  generateIndexCss,
  generateThemeCss,
  sameTheme,
  type Theme,
  themeRegistryItem,
} from "@/lib/theme/index";
import baseCss from "@/styles.css?raw";
import { getTheme } from "@/themes/index";

function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onPress={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function Command({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 py-1 pr-1 pl-3">
      <code className="min-w-0 flex-1 truncate font-mono text-xs">{children}</code>
      <CopyButton text={children} />
    </div>
  );
}

export function ExportDialog({
  theme,
  edit,
}: {
  theme: Theme;
  edit: (update: (theme: Theme) => Theme) => void;
}) {
  const nameId = useId();
  const titleId = useId();
  const curated = getTheme(theme.name);
  const published = curated !== undefined && sameTheme(curated, theme);
  const itemName = `theme-${theme.name}`;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const files = [
    {
      id: "index",
      label: "index.css",
      hint: "Complete Tailwind v4 stylesheet: this repo's styles.css with the theme's :root and .dark.",
      filename: "index.css",
      type: "text/css",
      text: generateIndexCss(theme, baseCss),
    },
    {
      id: "vars",
      label: "Variables",
      hint: "Just the :root and .dark blocks, to swap into a stylesheet that already maps the tokens.",
      filename: `${theme.name}.css`,
      type: "text/css",
      text: generateThemeCss(theme),
    },
    {
      id: "registry",
      label: "Registry item",
      hint: "shadcn registry:theme item — install it with the command above.",
      filename: `${itemName}.json`,
      type: "application/json",
      text: `${JSON.stringify(themeRegistryItem(theme), null, 2)}\n`,
    },
    {
      id: "json",
      label: "Theme JSON",
      hint: "This editor's format. Drop it in packages/ui/src/themes/ to curate it into the registry.",
      filename: `${theme.name}.json`,
      type: "application/json",
      text: `${JSON.stringify(theme, null, 2)}\n`,
    },
  ];

  return (
    <DialogTrigger>
      <Button size="sm">
        <Download data-icon="inline-start" />
        Export
      </Button>
      <Dialog className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export theme</DialogTitle>
          <DialogDescription>
            Install it with the shadcn CLI, or copy/download the CSS or JSON.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={theme.name}
              onChange={(event) => {
                const name = event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
                edit((current) => ({ ...current, name: name || "custom" }));
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              value={theme.title}
              onChange={(event) => {
                const title = event.target.value;
                edit((current) => ({ ...current, title: title || "Custom" }));
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Install</h3>
          {published ? (
            <>
              <Command>{`npx shadcn@latest add @fma-ui/${itemName}`}</Command>
              <p className="text-xs text-muted-foreground">
                Needs <code>{`"@fma-ui": "${origin}/r/{name}.json"`}</code> in your components.json
                registries. Or use the URL directly:
              </p>
              <Command>{`npx shadcn@latest add ${origin}/r/${itemName}.json`}</Command>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Customized themes aren't hosted: download the registry item, then install the file.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() =>
                    download(
                      `${itemName}.json`,
                      `${JSON.stringify(themeRegistryItem(theme), null, 2)}\n`,
                      "application/json",
                    )
                  }
                >
                  <Download data-icon="inline-start" />
                  {itemName}.json
                </Button>
              </div>
              <Command>{`npx shadcn@latest add ./${itemName}.json`}</Command>
            </>
          )}
        </div>
        <Tabs defaultSelectedKey="index" className="min-w-0">
          <TabsList>
            {files.map((file) => (
              <TabsTrigger key={file.id} id={file.id}>
                {file.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {files.map((file) => (
            <TabsContent key={file.id} id={file.id} className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{file.hint}</p>
                <div className="flex shrink-0 gap-1.5">
                  <CopyButton text={file.text} />
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => download(file.filename, file.text, file.type)}
                  >
                    <Download data-icon="inline-start" />
                    {file.filename}
                  </Button>
                </div>
              </div>
              <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs">
                {file.text}
              </pre>
            </TabsContent>
          ))}
        </Tabs>
      </Dialog>
    </DialogTrigger>
  );
}
