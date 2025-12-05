export function Home() {
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
        <div id="root">
          <div className="flex min-h-screen items-center justify-center bg-zinc-900">
            <h1 className="text-4xl font-bold text-white">Hello World 🐵</h1>
          </div>
        </div>
        <script type="module" src="/static/frontend.js" />
      </body>
    </html>
  );
}
