import { treaty } from "@elysiajs/eden";
import { QueryClient } from "@tanstack/react-query";

import { Api } from "@hebo/api";

import { isDevLocal } from "~/lib/env";

const url = isDevLocal
  ? "http://localhost:3000/api"
  : process.env.NEXT_PUBLIC_API_URL!;

export const queryClient = new QueryClient({
  // Return inner data for react-query compatibility
  defaultOptions: {
    queries: {
      select: (res: any) => {
        if (res.error) {
          throw new Error(res.error);
        }
        return res.data;
      },
    },
  },
});

export const api = treaty<Api>(url, {
  // Enable CORS-compatibility
  // ToDO: test whether it actually works
  fetch: { credentials: "include" },

  // Throw errors for react-query compatibility
  async fetcher(url, options) {
    const res = await fetch(url, options);

    if (!res.ok) {
      // res.json() can only be called once for every query
      // work on cloned res to avoid introducing side-effects
      const body = await res.clone().json();
      throw new Error(body.error);
    }

    return res;
  },
});
