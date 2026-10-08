import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DocsNav } from "../../site/docs-nav";

export const Route = createFileRoute("/_site/_docs")({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <div className="mx-auto flex max-w-screen-2xl gap-8 px-4 md:px-6">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pr-2 md:block">
        <DocsNav />
      </aside>
      <main className="min-w-0 flex-1 py-8">
        <Outlet />
      </main>
    </div>
  );
}
