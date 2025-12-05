import { renderToReadableStream } from "react-dom/server";

import { App } from "./App";
import { HomeDocument } from "./Home";

/**
 * Renders the full page HTML as a readable stream for SSR.
 */
export async function renderHome(): Promise<ReadableStream> {
  return renderToReadableStream(
    <HomeDocument>
      <App />
    </HomeDocument>,
  );
}
