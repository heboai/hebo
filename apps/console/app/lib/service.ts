import { treaty } from "@elysiajs/eden";
import ky, { HTTPError } from "ky";

import { authService } from "~console/lib/auth";
import { isDevLocal } from "~console/lib/env";

import type { Api } from "~api";

const url = isDevLocal
  ? "http://localhost:5173/api"
  : import.meta.env.VITE_API_URL!;

export const kyFetch = ky.extend({
  throwHttpErrors: false,
  hooks: {
    afterResponse: [
      async (_req, _opts, res) => {
        // Successful response, all good
        if (res.ok) return res;

        // Don't throw on application-level errors
        if ([400, 404, 409, 422].includes(res.status)) return res;

        // Else, unpack error to surface in the UI
        const body = (res.headers.get("content-type") ?? "").includes("json")
          ? await res.json()
          : await res.text();
        const err = new HTTPError(res, _req, _opts);

        if (typeof body === "string") err.message = body;

        // Extract ElysiaJS structured errors
        if (typeof body === "object" && body && "stack" in body)
          err.stack = String(body.stack);

        if (typeof body === "object" && body && "message" in body)
          err.message = String(body.message);

        throw err;
      },
    ],
  },
});

export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const headers = new Headers(init?.headers ?? {});
  const token = authService.getAccessToken();
  if (token) headers.set("x-stack-access-token", token);

  return kyFetch(input, {
    ...init,
    headers,
  });
};

export const api = treaty<Api>(url, {
  fetcher: fetchWithAuth,
}).v1;
