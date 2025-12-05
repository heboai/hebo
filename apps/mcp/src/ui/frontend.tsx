import { hydrateRoot } from "react-dom/client";

import { App } from "./App";

const root = document.querySelector("#root");
if (root) {
  hydrateRoot(root, <App />);
}
