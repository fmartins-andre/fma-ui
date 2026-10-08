import { useNavigate } from "@tanstack/react-router";
import { BoxIcon, FileTextIcon, LayoutTemplateIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/core/button/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/command/command";
import { Kbd, KbdGroup } from "@/core/kbd/kbd";
import { BLOCKS, COMPONENTS } from "./registry";

const PAGES = [
  { id: "/docs", title: "Introduction" },
  { id: "/components", title: "Components" },
  { id: "/blocks", title: "Blocks" },
  { id: "/themes", title: "Theme editor" },
];

/** ⌘K / Ctrl+K search over the pages, components and blocks. */
export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    void navigate({ to: href });
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 text-muted-foreground sm:w-56 lg:w-64"
        onPress={() => setOpen(true)}
      >
        <SearchIcon />
        <span className="flex-1 truncate text-left">Search docs...</span>
        <KbdGroup className="hidden sm:inline-flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search the docs, components and blocks"
      >
        <Command>
          <CommandInput placeholder="Search components and blocks..." />
          <CommandList
            aria-label="Results"
            onAction={(key) => go(String(key))}
            renderEmptyState={() => <CommandEmpty>No results found.</CommandEmpty>}
          >
            <CommandGroup heading="Pages">
              {PAGES.map((page) => (
                <CommandItem key={page.id} id={page.id} textValue={page.title}>
                  <FileTextIcon />
                  {page.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Components">
              {COMPONENTS.map((item) => (
                <CommandItem key={item.name} id={`/components/${item.name}`} textValue={item.title}>
                  <BoxIcon />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Blocks">
              {BLOCKS.map((item) => (
                <CommandItem key={item.name} id={`/blocks/${item.name}`} textValue={item.title}>
                  <LayoutTemplateIcon />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
