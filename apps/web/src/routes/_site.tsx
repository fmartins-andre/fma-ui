import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useMode } from "../site/mode";
import { SiteFooter, SiteHeader } from "../site/site-header";
import { useThemeState } from "../site/theme";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

// Tools that fill the viewport under the header and scroll inside their own panes.
const FULL_HEIGHT = new Set(["/themes"]);

function SiteLayout() {
  const { mode, setMode } = useMode();
  useThemeState();
  const fullHeight = FULL_HEIGHT.has(useLocation({ select: (location) => location.pathname }));
  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        fullHeight ? "h-dvh" : "min-h-dvh",
      )}
    >
      <SiteHeader mode={mode} onModeChange={setMode} />
      <div className={cn("flex-1", fullHeight && "min-h-0")}>
        <Outlet />
      </div>
      {!fullHeight && <SiteFooter />}
    </div>
  );
}
