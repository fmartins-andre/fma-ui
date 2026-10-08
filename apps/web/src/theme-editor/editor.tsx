import { Redo2, RotateCcw, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/tabs/tabs";
import { Tooltip, TooltipTrigger } from "@/core/tooltip/tooltip";
import { type EditableSetting, sameTheme } from "@/lib/theme/index";
import { ThemeSelect } from "../site/theme-select";
import { ColorsPanel } from "./colors-panel";
import { ExportDialog } from "./export-dialog";
import { ImportDialog } from "./import-dialog";
import { type OTHER_SETTINGS, OtherPanel } from "./other-panel";
import { Palette, TypographySample } from "./palette";
import { Showcase } from "./showcase";
import { SidebarPreview } from "./sidebar-preview";
import { type TYPOGRAPHY_SETTINGS, TypographyPanel } from "./typography-panel";
import { useThemeEditor } from "./use-theme-editor";

// Every styling field of ThemeSchema must have a control in some panel (colors
// are covered by COLOR_GROUPS, checked in packages/ui's
// tests/theme-editor-coverage.test.ts). Adding a field to ThemeSchema without
// listing it in TYPOGRAPHY_SETTINGS or OTHER_SETTINGS — and rendering it there,
// which their Record types force — fails this type-check.
type UncoveredSetting = Exclude<
  EditableSetting,
  (typeof TYPOGRAPHY_SETTINGS)[number] | (typeof OTHER_SETTINGS)[number]
>;
const SETTINGS_COVERED: [UncoveredSetting] extends [never] ? true : UncoveredSetting = true;
void SETTINGS_COVERED;

function IconButton({
  label,
  onPress,
  isDisabled,
  children,
}: {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <TooltipTrigger>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        onPress={onPress}
        isDisabled={isDisabled}
      >
        {children}
      </Button>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  );
}

// Panels wrap below the tab list and the actions.
const PANEL = "order-last basis-full pt-2";

export function ThemeEditor({ preset }: { preset?: string }) {
  const { state, dispatch, edit, mode } = useThemeEditor(preset);
  const { theme, loaded } = state;
  const modified = !sameTheme(theme, loaded);

  return (
    <div className="flex h-full flex-col">
      {/* The site header names the page; the heading is for screen readers and outlines. */}
      <h1 className="sr-only">Themes</h1>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="max-h-[45dvh] shrink-0 overflow-y-auto border-b p-4 lg:max-h-none lg:w-96 lg:border-r lg:border-b-0">
          <Tabs defaultSelectedKey="colors">
            <TabsList className="w-full">
              <TabsTrigger id="colors">Colors</TabsTrigger>
              <TabsTrigger id="typography">Typography</TabsTrigger>
              <TabsTrigger id="other">Other</TabsTrigger>
            </TabsList>
            <TabsContent id="colors">
              <p className="py-2 text-xs text-muted-foreground">
                Editing the <strong>{mode}</strong> palette. Toggle the mode in the header to edit
                the other one.
              </p>
              <ColorsPanel theme={theme} mode={mode} edit={edit} />
            </TabsContent>
            <TabsContent id="typography" className="pt-4">
              <TypographyPanel theme={theme} edit={edit} />
            </TabsContent>
            <TabsContent id="other" className="pt-4">
              <OtherPanel
                theme={theme}
                mode={mode}
                hsl={state.hsl}
                edit={edit}
                dispatch={dispatch}
              />
            </TabsContent>
          </Tabs>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          {/*
            The actions share the tab list's row but stay outside <Tabs>: react-aria
            collects every tab in its subtree, the import dialog's own tabs included.
            <Tabs> is display: contents, so its list and panels join this flex row.
          */}
          <div className="flex flex-wrap items-center gap-2">
            <Tabs defaultSelectedKey="components" className="contents">
              <TabsList className="max-w-full justify-start overflow-x-auto">
                <TabsTrigger id="components">Components</TabsTrigger>
                <TabsTrigger id="sidebar">Sidebar</TabsTrigger>
                <TabsTrigger id="palette">Palette & contrast</TabsTrigger>
                <TabsTrigger id="typography">Typography</TabsTrigger>
              </TabsList>
              <TabsContent id="components" className={PANEL}>
                <Showcase />
              </TabsContent>
              <TabsContent id="sidebar" className={PANEL}>
                <SidebarPreview />
              </TabsContent>
              <TabsContent id="palette" className={PANEL}>
                <Palette theme={theme} mode={mode} />
              </TabsContent>
              <TabsContent id="typography" className={PANEL}>
                <TypographySample />
              </TabsContent>
            </Tabs>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Same picker as the site header, which hides it below md. */}
              <ThemeSelect className="w-48 md:hidden" />
              {modified && <Badge variant="warning-light">Modified</Badge>}
              <ImportDialog onImport={(next) => dispatch({ type: "load", theme: next })} />
              <div className="flex items-center">
                <IconButton
                  label="Undo (Ctrl+Z)"
                  isDisabled={state.past.length === 0}
                  onPress={() => dispatch({ type: "undo" })}
                >
                  <Undo2 />
                </IconButton>
                <IconButton
                  label="Redo (Ctrl+Shift+Z)"
                  isDisabled={state.future.length === 0}
                  onPress={() => dispatch({ type: "redo" })}
                >
                  <Redo2 />
                </IconButton>
                <IconButton
                  label={`Reset to ${loaded.title}`}
                  isDisabled={!modified}
                  onPress={() => dispatch({ type: "reset" })}
                >
                  <RotateCcw />
                </IconButton>
              </div>
              <ExportDialog theme={theme} edit={edit} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
