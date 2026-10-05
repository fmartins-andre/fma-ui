import { createFileRoute } from "@tanstack/react-router";

import registry from "../../../../packages/ui/registry.json";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
      <h1>{registry.name} registry</h1>
      <p>
        Register the namespace in your <code>components.json</code> (
        <code>{'"registries": { "@fma-ui": "<this-site-url>/r/{name}.json" }'}</code>), then add any
        item:
      </p>
      <pre style={{ background: "#f4f4f5", padding: "0.75rem 1rem", borderRadius: 6 }}>
        npx shadcn add @fma-ui/&lt;name&gt;
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
