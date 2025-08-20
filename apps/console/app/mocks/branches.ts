import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~/mocks/db";

export const branchHandlers = [
  http.post<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ request }) => {
      const body = (await request.json()) as ReturnType<
        typeof db.branch.create
      >;

      const branch = {
        name: body.name,
        slug: slugify(body.name, { lower: true, strict: true }),
      };

      try {
        db.branch.create(branch);
      } catch {
        return new HttpResponse("Branch with the same name already exists", {
          status: 409,
        });
      }

      await delay(200);
      return HttpResponse.json(branch, { status: 201 });
    },
  ),

  http.get<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async () => {
      const branches = db.branch.getAll();

      await delay(1000);
      return HttpResponse.json(branches);
    },
  ),
];
