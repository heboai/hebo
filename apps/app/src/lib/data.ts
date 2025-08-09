import { edenTreaty } from "@elysiajs/eden";

import { Api } from "@hebo/api";

import { isDevLocal } from "~/lib/env";


const url = isDevLocal ? "/api" : process.env.NEXT_PUBLIC_API_URL!;

export const api = edenTreaty<Api>(url);
