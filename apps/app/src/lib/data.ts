import { treaty } from "@elysiajs/eden";
import {
  useMutation,
  useQuery,
  QueryClient,
  QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { Api } from "@hebo/api";

import { isDevLocal } from "~/lib/env";

const url = isDevLocal
  ? "http://localhost:3000/api"
  : process.env.NEXT_PUBLIC_API_URL!;

const api = treaty<Api>(url, {
  // Enable CORS-compatibility
  // TODO: test whether it actually works
  fetch: { credentials: "include" },
}).v1;

// Ensure "real" errors are not surpressed
const shouldThrow = (error: unknown): boolean => {
  const errObj = error as { status?: unknown };

  // Network / CORS / DNS / offline — no response status
  if (error instanceof TypeError && errObj.status === undefined) {
    return true;
  }

  // If fetcher throws `{ status, body }` for HTTP errors:
  if (typeof errObj.status === "number") {
    const status = errObj.status;

    if (status >= 500) return true; // Infrastructure issues
    if (status === 401 || status === 403) return true; // Auth issues
  }

  return false; // Validation, 404, etc. stay local
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { throwOnError: shouldThrow },
    mutations: { throwOnError: shouldThrow },
  },
});

// Unwrap eden result: throw "error" or return "data"
type TreatyResult = {
  data: unknown;
  error: unknown | null;
};

function unwrapEden<T>(res: TreatyResult): T {
  if (res.error) throw res.error;
  return res.data as T;
}

// Simple wrapper for useQuery to apply unwrapEden & queryClient singleton
const useEdenQuery = <
  TData,
  TQueryKey extends QueryKey = QueryKey,
  TSelected = TData,
>(
  options: Omit<
    UseQueryOptions<TData, Error, TSelected, TQueryKey>,
    "queryFn"
  > & {
    queryFn: () => Promise<TreatyResult>;
  },
): UseQueryResult<TSelected, Error> => {
  const { queryFn, ...rest } = options;
  return useQuery<TData, Error, TSelected, TQueryKey>(
    {
      ...rest,
      queryFn: async () => unwrapEden<TData>(await queryFn()),
    },
    queryClient,
  );
};

// Simple wrapper for useMutation to apply unwrapEden & queryClient singleton
function useEdenMutation<TData, TVariables = void, TContext = unknown>(
  options: Omit<
    UseMutationOptions<TData, Error, TVariables, TContext>,
    "mutationFn"
  > & {
    mutationFn: (vars: TVariables) => Promise<TreatyResult>;
  },
): UseMutationResult<TData, Error, TVariables, TContext> {
  const { mutationFn, ...rest } = options;

  return useMutation<TData, Error, TVariables, TContext>(
    {
      ...rest,
      mutationFn: async (vars) => unwrapEden<TData>(await mutationFn(vars)),
    },
    queryClient,
  );
}

export { api, queryClient, unwrapEden, useEdenMutation, useEdenQuery };
