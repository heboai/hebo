import { treaty } from "@elysiajs/eden";

import { isDevLocal } from "~console/lib/env";

import type { Api } from "~api";


const url = isDevLocal
  ? "http://localhost:5173/api"
  : import.meta.env.VITE_API_URL!;

export const api = treaty<Api>(url, {
  fetch: { credentials: "include" },
}).v1;
