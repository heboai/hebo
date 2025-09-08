import { treaty } from "@elysiajs/eden";

import { authService } from "~console/lib/auth";
import { isDevLocal } from "~console/lib/env";

import type { Api } from "~api";

const url = isDevLocal
  ? "http://localhost:5173/api"
  : import.meta.env.VITE_API_URL!;

export const api = treaty<Api>(url, {
  async fetcher(requestUrl, init) {
    const token = await authService.getAccessToken();
    const headers = new Headers(init?.headers ?? {});
    if (token) headers.set("x-stack-access-token", token);
    return fetch(requestUrl, { ...init, headers });
  },
}).v1;
