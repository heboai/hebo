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

  // Update model configuration
  http.put<{ agentSlug: string; branchSlug: string; modelAlias: string }>(
    "/api/v1/agents/:agentSlug/branches/:branchSlug/models/:modelAlias",
    async ({ request, params }) => {
      const body = (await request.json()) as {
        alias: string;
        modelType: string;
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

      // Update or create models array
      if (!branch.models) branch.models = [];

      const modelIndex = branch.models.findIndex(
        (m: any) => m.alias === params.modelAlias,
      );
      if (modelIndex === -1) {
        branch.models.push({ alias: body.alias, type: body.modelType });
      } else {
        branch.models[modelIndex] = { alias: body.alias, type: body.modelType };
      }

      await delay(500);
      return HttpResponse.json({ success: true });
    },
  ),

  // Remove model configuration
  http.delete<{ agentSlug: string; branchSlug: string; modelAlias: string }>(
    "/api/v1/agents/:agentSlug/branches/:branchSlug/models/:modelAlias",
    async ({ params }) => {
      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });
      if (!agent) return new HttpResponse("Agent not found", { status: 404 });

      const branch = agent.branches?.find(
        (b: any) => b.slug === params.branchSlug,
      );
      if (!branch || !branch.models)
        return new HttpResponse("Branch not found", { status: 404 });

      // Prevent deletion of default model
      if (params.modelAlias === "default") {
        return new HttpResponse("Cannot delete default model", { status: 400 });
      }

      branch.models = branch.models.filter(
        (m: any) => m.alias !== params.modelAlias,
      );

      await delay(300);
      return new HttpResponse(undefined, { status: 204 });
    },
  ),
];
