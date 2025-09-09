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

      const branch = {
        name: body.name,
        slug: slugify(body.name, { lower: true, strict: true }),
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

  http.get<{ agentSlug: string; branchSlug: string }>(
    "/api/v1/agents/:agentSlug/branches/:branchSlug",
    async ({ params }) => {
      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });
      if (!agent) return new HttpResponse("Agent not found", { status: 404 });

      const branch = agent.branches?.find(
        (b: any) => b.slug === params.branchSlug,
      );
      if (!branch) return new HttpResponse("Branch not found", { status: 404 });

      await delay(500);
      return HttpResponse.json(branch);
    },
  ),

  // Update entire branch (including models JSON object)
  http.put<{ agentSlug: string; branchSlug: string }>(
    "/api/v1/agents/:agentSlug/branches/:branchSlug",
    async ({ request, params }) => {
      const body = (await request.json()) as {
        name?: string;
        models?: Array<{ alias: string; type: string; endpoint?: any }>;
      };

      // Find agent and branch
      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });
      if (!agent) return new HttpResponse("Agent not found", { status: 404 });

      const branch = agent.branches?.find(
        (b: any) => b.slug === params.branchSlug,
      );
      if (!branch) return new HttpResponse("Branch not found", { status: 404 });

      // Update branch properties
      if (body.name) {
        branch.name = body.name;
        branch.slug = slugify(body.name, { lower: true, strict: true });
      }

      // Update models JSON object
      if (body.models) {
        branch.models = body.models;
      }

      await delay(500);
      return HttpResponse.json(branch);
    },
  ),
];
