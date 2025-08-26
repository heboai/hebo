import { treaty } from "@elysiajs/eden";

import type { Api } from "@hebo/api";

import { isDevLocal } from "~/lib/env";

const url = isDevLocal
  ? "http://localhost:5173/api"
  : import.meta.env.VITE_API_URL!;

export const api = treaty<Api>(url, {
  // FUTURE: Enable CORS-compatibility
  fetch: { credentials: "include" },
}).v1;
