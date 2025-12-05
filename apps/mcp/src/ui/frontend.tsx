/**
 * This file is the entry point for client-side React hydration.
 * It hydrates the server-rendered HTML with React interactivity.
 */

import { hydrateRoot } from "react-dom/client";
import "./index.css";

import { App } from "./App";

function start() {
  const root = document.querySelector("#root");
  if (root) {
    hydrateRoot(root, <App />);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
