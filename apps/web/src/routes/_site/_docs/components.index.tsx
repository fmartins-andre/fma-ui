import { createFileRoute } from "@tanstack/react-router";
import { Link } from "react-aria-components";
import { COMPONENTS, componentsByCategory } from "../../../site/registry";

export const Route = createFileRoute("/_site/_docs/components/")({
  head: () => ({ meta: [{ title: "Components · fma-ui" }] }),
  component: ComponentsIndex,
});

function ComponentsIndex() {
  return (
    <div className="pb-12">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Components</h1>
      <p className="mt-2 max-w-2xl text-base text-muted-foreground">
        {COMPONENTS.length} components built on react-aria-components. Each one installs with the
        shadcn CLI into <code className="font-mono text-sm">components/fma-ui/</code>.
      </p>
      {componentsByCategory().map((group) => (
        <section
          key={group.category}
          aria-labelledby={`category-${group.category}`}
          className="mt-10"
        >
          <h2
            id={`category-${group.category}`}
            className="border-b pb-2 font-heading text-lg font-semibold tracking-tight"
          >
            {group.title}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <li key={item.name}>
                <Link
                  href={`/components/${item.name}`}
                  className="flex h-full flex-col gap-1 rounded-xl border p-4 outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {item.description.replace(/`/g, "")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
