import { treaty } from "@elysiajs/eden";

import { Api } from "@hebo/api";

import { isDevLocal } from "~/lib/env";

const url = isDevLocal ? "/api" : process.env.NEXT_PUBLIC_API_URL!;

// TODO: test whether token is correctly passed on
export const api = treaty<Api>(url, { fetch: { credentials: "include" } });
