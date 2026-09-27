import { createFileRoute } from "@tanstack/react-router";

import registry from "../../../../packages/ui/registry.json";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
      <h1>{registry.name} registry</h1>
      <p>Add any item to a shadcn-compatible project with:</p>
      <pre style={{ background: "#f4f4f5", padding: "0.75rem 1rem", borderRadius: 6 }}>
        npx shadcn add {"<this-site-url>"}/r/&lt;name&gt;.json
      </pre>
      <ul>
        {registry.items.map((item) => (
          <li key={item.name} style={{ marginBottom: "0.5rem" }}>
            <code>{item.name}</code> — {item.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
