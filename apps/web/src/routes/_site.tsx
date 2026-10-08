import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useMode } from "../site/mode";
import { SiteFooter, SiteHeader } from "../site/site-header";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  const { mode, setMode } = useMode();
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader mode={mode} onModeChange={setMode} />
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}
