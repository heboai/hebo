import { edenTreaty } from "@elysiajs/eden";

import type { Api } from "@hebo/api";

export const api = edenTreaty<Api>(process.env.NEXT_PUBLIC_API_URL!);
