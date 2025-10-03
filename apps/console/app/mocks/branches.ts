import { http, HttpResponse, delay } from "msw";

import { db } from "~console/mocks/db";

export const branchHandlers = [
  http.get<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ params }) => {
      const branches = db.branch.findMany({
        where: { agentSlug: { equals: params.agentSlug } },
      });

      await delay(1000);
      return HttpResponse.json(branches);
    },
  ),

  // Update entire branch (including models JSON object)
  http.patch<{ agentSlug: string; branchSlug: string }>(
    "/api/v1/agents/:agentSlug/branches/:branchSlug",
    async ({ request, params }) => {
      const body = (await request.json()) as {
        name?: string;
        models?: Array<{ alias: string; type: string; endpoint?: unknown }>;
      };

      const branch = db.branch.findFirst({
        where: {
          agentSlug: { equals: params.agentSlug },
          slug: { equals: params.branchSlug },
        },
      });

      if (!branch) {
        return new HttpResponse("Branch not found", { status: 404 });
      }

      if (body.models) {
        branch.models = body.models;
      }

      db.branch.update({
        where: { id: { equals: branch.id } },
        data: branch,
      });

      await delay(500);
      return HttpResponse.json(branch);
    },
  ),
];
