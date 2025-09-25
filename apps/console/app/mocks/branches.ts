import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~console/mocks/db";

export const branchHandlers = [
  http.post<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ request }) => {
      const body = (await request.json()) as ReturnType<
        typeof db.branch.create
      >;

      const slug = slugify(body.name, { lower: true, strict: true });

      // Idempotency: if a branch with the same slug already exists, return it
      const existing = db.branch.findFirst({
        where: { slug: { equals: slug } },
      });
      if (existing) {
        return HttpResponse.json(existing, { status: 200 });
      }

      const branch = {
        name: body.name,
        slug,
        models: body.models,
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
