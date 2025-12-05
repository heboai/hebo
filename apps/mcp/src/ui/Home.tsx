export function HomeDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/static/logo.svg" />
        <title>Bun + React</title>
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        <div id="root">{children}</div>
        <script type="module" src="/static/frontend.js" />
      </body>
    </html>
  );
}
