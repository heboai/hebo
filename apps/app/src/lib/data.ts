import { treaty } from "@elysiajs/eden";
import {
  useMutation,
  useQuery,
  QueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import { Api } from "@hebo/api";

import { isDevLocal } from "~/lib/env";

const url = isDevLocal
  ? `${globalThis.location.origin}/api`
  : process.env.NEXT_PUBLIC_API_URL!;

const api = treaty<Api>(url, {
  // Enable CORS-compatibility
  // ToDO: test whether it actually works
  fetch: { credentials: "include" },
});

const queryClient = new QueryClient();

function unwrapEden<T>(res: any): T {
  if (res?.error) {
    const { status, value } = res.error;
    const err = new Error(value.error);
    (err as any).status = status;
    throw err;
  }
  return res.data as T;
}

function useEdenQuery<TData, TQueryKey extends readonly unknown[] = any>(
  options: Omit<UseQueryOptions<TData, Error, TData, TQueryKey>, "queryFn"> & {
    queryFn: () => Promise<any>;
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

function useEdenMutation<TData, TVariables = void>(
  options: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn"> & {
    mutationFn: (vars: TVariables) => Promise<any>; // Eden result
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
