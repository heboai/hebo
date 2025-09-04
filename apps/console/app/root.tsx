import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";

import "./init";

import "./styles/tailwind.css";
import "./styles/global.css";
import "./styles/stack.css";
import { ErrorView } from "./components/ui/ErrorView";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href:
      "https://fonts.googleapis.com/css2?" +
      "family=Geist:wght@100..900&" +
      "family=Geist+Mono:wght@100..900&" +
      "display=swap",
  },
  { rel: "icon", href: "/hebo-icon.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hebo Cloud</title>
        <meta
          name="description"
          content="The fastest way to build &amp; scale agents"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="min-h-dvh">{children}</div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorView error={error} />;
}
