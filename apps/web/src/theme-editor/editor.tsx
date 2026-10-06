import { Moon, Redo2, RotateCcw, Sun, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/core/badge/badge";
import { Button } from "@/core/button/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/core/select/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/tabs/tabs";
import { Tooltip, TooltipTrigger } from "@/core/tooltip/tooltip";
import { type EditableSetting, sameTheme } from "@/lib/theme/index";
import { getTheme, THEMES } from "@/themes/index";
import { ColorsPanel } from "./colors-panel";
import { ExportDialog } from "./export-dialog";
import { ImportDialog } from "./import-dialog";
import { type OTHER_SETTINGS, OtherPanel } from "./other-panel";
import { Palette, TypographySample } from "./palette";
import { Showcase } from "./showcase";
import { SidebarPreview } from "./sidebar-preview";
import { type TYPOGRAPHY_SETTINGS, TypographyPanel } from "./typography-panel";
import { useThemeEditor } from "./use-theme-editor";

const CUSTOM_KEY = "__custom";

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
        size="icon-sm"
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

export function ThemeEditor({ preset }: { preset?: string }) {
  const { state, dispatch, edit, mode, setMode } = useThemeEditor(preset);
  const { theme, loaded } = state;
  const loadedPreset = getTheme(loaded.name);
  const presetKey = loadedPreset && sameTheme(loadedPreset, loaded) ? loaded.name : CUSTOM_KEY;
  const modified = !sameTheme(theme, loaded);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <a href="/" className="font-heading font-semibold">
          fma-ui
        </a>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-heading font-medium">Themes</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            aria-label="Theme preset"
            selectedKey={presetKey}
            onSelectionChange={(key) => {
              const next = key === null ? undefined : getTheme(String(key));
              if (next) dispatch({ type: "load", theme: next });
            }}
          >
            <SelectTrigger className="w-48" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presetKey === CUSTOM_KEY && (
                <>
                  <SelectItem id={CUSTOM_KEY}>{loaded.title} (imported)</SelectItem>
                  <SelectSeparator />
                </>
              )}
              {THEMES.map((item) => (
                <SelectItem key={item.name} id={item.name}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <IconButton
              label={mode === "dark" ? "Light mode" : "Dark mode"}
              onPress={() => setMode(mode === "dark" ? "light" : "dark")}
            >
              {mode === "dark" ? <Sun /> : <Moon />}
            </IconButton>
          </div>
          <ExportDialog theme={theme} edit={edit} />
        </div>
      </header>

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
          <Tabs defaultSelectedKey="components">
            <TabsList>
              <TabsTrigger id="components">Components</TabsTrigger>
              <TabsTrigger id="sidebar">Sidebar</TabsTrigger>
              <TabsTrigger id="palette">Palette & contrast</TabsTrigger>
              <TabsTrigger id="typography">Typography</TabsTrigger>
            </TabsList>
            <TabsContent id="components" className="pt-4">
              <Showcase />
            </TabsContent>
            <TabsContent id="sidebar" className="pt-4">
              <SidebarPreview />
            </TabsContent>
            <TabsContent id="palette" className="pt-4">
              <Palette theme={theme} mode={mode} />
            </TabsContent>
            <TabsContent id="typography" className="pt-4">
              <TypographySample />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
