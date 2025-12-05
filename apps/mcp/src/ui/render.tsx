import { renderToReadableStream } from "react-dom/server";

import { App } from "./App";

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/static/logo.svg" />
        <title>Hebo MCP</title>
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        <div id="root">{children}</div>
        <script type="module" src="/static/frontend.js" />
      </body>
    </html>
  );
}

export async function renderHome(): Promise<ReadableStream> {
  return renderToReadableStream(
    <Document>
      <App />
    </Document>,
  );
}
