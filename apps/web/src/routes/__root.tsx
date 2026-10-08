import { createRootRoute, HeadContent, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { RouterProvider } from "react-aria-components";
import { MODE_SCRIPT } from "../site/mode";
import "../styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "fma-ui" },
      {
        name: "description",
        content: "Accessible react-aria components, blocks and themes for the shadcn CLI.",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <a href="/" className="text-sm underline underline-offset-4">
        Back to the home page
      </a>
    </main>
  );
}

// Static files served next to the app (Storybook build, registry JSON): plain
// links, not router locations — the router would rewrite and handle them.
const isStaticPath = (href: string) => /^\/(storybook|r)(\/|\?|$)/.test(href);

function RootComponent() {
  const router = useRouter();
  return (
    <RootDocument>
      {/* react-aria links (LinkButton, menus, Link) navigate through TanStack Router. */}
      <RouterProvider
        navigate={(href) => {
          if (isStaticPath(href)) window.location.assign(href);
          else void router.navigate({ href });
        }}
        useHref={(href) =>
          isStaticPath(href) ? href : router.buildLocation({ href } as never).href
        }
      >
        <Outlet />
      </RouterProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // The mode script adds `dark` before hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
