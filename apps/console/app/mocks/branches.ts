import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~console/mocks/db";

export const branchHandlers = [
  http.post<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ request, params }) => {
      const body = (await request.json()) as ReturnType<
        typeof db.branch.create
      >;

      const branch = {
        name: body.name,
        slug: slugify(body.name, { lower: true, strict: true }),
        agent_slug: params.agentSlug,
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

  http.patch<{ agentSlug: string; branchSlug: string }>(
    "/api/v1/agents/:agentSlug/branches/:branchSlug",
    async ({ params, request }) => {
      const body = (await request.json()) as {
        models: ReturnType<typeof db.branch.create>["models"];
      };

      let branch;

      try {
        branch = db.branch.findFirst({
          where: {
            agent_slug: { equals: params.agentSlug },
            slug: { equals: params.branchSlug },
          },
          strict: true,
        });
      } catch {
        return new HttpResponse("Branch with the slug not found", {
          status: 404,
        });
      }

      const updatedBranch = db.branch.update({
        where: { id: { equals: branch.id } },
        data: { models: body.models },
      });

      await delay(500);
      return HttpResponse.json(updatedBranch);
    },
  ),
];
