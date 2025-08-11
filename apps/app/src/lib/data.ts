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
  // ToDO: test whether it actually works
  fetch: { credentials: "include" },
});

const queryClient = new QueryClient();

// Unwrap eden result: throw "error" or return "data"
type EdenError = { status?: number; value?: { error: string } };
type EdenResponse<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: EdenError };

function unwrapEden<T>(res: EdenResponse<T>): T {
  if (res?.error) {
    const err = new (class extends Error {
      status?: number;
    })(res.error.value?.error);
    err.status = res.error.status;
    throw err;
  }
  return res.data as T;
}

// Simple wrapper for useQuery to apply unwrapEden & queryClient singleton
function useEdenQuery<TData, TQueryKey extends QueryKey = QueryKey>(
  options: Omit<UseQueryOptions<TData, Error, TData, TQueryKey>, "queryFn"> & {
    queryFn: () => Promise<EdenResponse<TData>>;
  },
): UseQueryResult<TData, Error> {
  const { queryFn, ...rest } = options;

  return useQuery<TData, Error, TData, TQueryKey>(
    {
      ...rest,
      queryFn: async () => unwrapEden<TData>(await queryFn()),
    },
    queryClient,
  );
}

// Simple wrapper for useMutation to apply unwrapEden & queryClient singleton
function useEdenMutation<TData, TVariables = void>(
  options: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn"> & {
    mutationFn: (vars: TVariables) => Promise<EdenResponse<TData>>;
  },
): UseMutationResult<TData, Error, TVariables> {
  const { mutationFn, ...rest } = options;

  return useMutation<TData, Error, TVariables>(
    {
      ...rest,
      mutationFn: async (vars) => unwrapEden<TData>(await mutationFn(vars)),
    },
    queryClient,
  );
}

export { api, queryClient, unwrapEden, useEdenMutation, useEdenQuery };
