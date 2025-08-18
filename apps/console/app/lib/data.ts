import { treaty } from "@elysiajs/eden";

import type { Api } from "@hebo/api";

import { isDevLocal } from "~/lib/env";

const url = isDevLocal
  ? "http://localhost:5173/api"
  : import.meta.env.VITE_API_URL!;

export const api = treaty<Api>(url, {
  // Enable CORS-compatibility
  // TODO: test whether it actually works
  fetch: { credentials: "include" },
}).v1;
