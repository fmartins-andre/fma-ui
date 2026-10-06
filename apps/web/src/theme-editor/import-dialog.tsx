import { Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/button/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/dialog/dialog";
import { Input } from "@/core/input/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/tabs/tabs";
import { Textarea } from "@/core/textarea/textarea";
import { parseThemeInput, type Theme } from "@/lib/theme/index";
import { DEFAULT_THEME } from "@/themes/index";

const IDENTITY = { name: "custom", title: "Custom", description: "Imported in the theme editor." };

export function ImportDialog({ onImport }: { onImport: (theme: Theme) => void }) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const importText = (input: string) => {
    try {
      onImport(parseThemeInput(input, DEFAULT_THEME, IDENTITY));
      setError(null);
      setText("");
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm">
        <Upload data-icon="inline-start" />
        Import
      </Button>
      <Dialog className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import a theme</DialogTitle>
          <DialogDescription>
            A shadcn <code>styles.css</code> (from here, tweakcn or ui.shadcn.com/themes), a shadcn
            registry theme item such as <code>tweakcn.com/r/themes/&lt;id&gt;.json</code>, or a
            theme JSON exported here. Missing tokens come from the default theme.
          </DialogDescription>
        </DialogHeader>
        <Tabs onSelectionChange={() => setError(null)}>
          <TabsList>
            <TabsTrigger id="paste">Paste</TabsTrigger>
            <TabsTrigger id="url">URL</TabsTrigger>
            <TabsTrigger id="file">File</TabsTrigger>
          </TabsList>
          <TabsContent id="paste" className="flex flex-col gap-3">
            <Textarea
              aria-label="CSS or JSON"
              className="h-56 font-mono text-xs"
              placeholder={":root {\n  --background: oklch(1 0 0);\n  …\n}\n.dark { … }"}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <DialogFooter>
              <Button isDisabled={!text.trim()} onPress={() => importText(text)}>
                Import
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent id="url" className="flex flex-col gap-3">
            <Input
              aria-label="Theme URL"
              type="url"
              placeholder="https://tweakcn.com/r/themes/amethyst-haze.json"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <DialogFooter>
              <Button
                isDisabled={!url.trim() || busy}
                onPress={async () => {
                  setBusy(true);
                  try {
                    const response = await fetch(url.trim());
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    importText(await response.text());
                  } catch (cause) {
                    setError(
                      `Couldn't fetch it (${cause instanceof Error ? cause.message : cause}). The server must allow CORS; otherwise download it and paste.`,
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Fetching…" : "Fetch and import"}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent id="file" className="flex flex-col gap-3">
            <Input
              aria-label="Theme file"
              type="file"
              accept=".css,.json,text/css,application/json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) importText(await file.text());
              }}
            />
          </TabsContent>
        </Tabs>
        {error && (
          <p role="alert" className="text-sm text-destructive-foreground">
            {error}
          </p>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
