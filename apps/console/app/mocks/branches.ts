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
        models: body.models,
        agentSlug: params.agentSlug,
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
    async ({ params }) => {
      try {
        const branches = db.branch.findMany({
          where: { agentSlug: { equals: params.agentSlug } },
        });

        await delay(1000);
        return HttpResponse.json(branches);
      } catch {
        return new HttpResponse("Failed to fetch branches", { status: 500 });
      }
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

      try {
        const branch = db.branch.findFirst({
          where: {
            agentSlug: { equals: params.agentSlug },
            slug: { equals: params.branchSlug },
          },
        });

        if (!branch) {
          return new HttpResponse("Branch not found", { status: 404 });
        }

        // Update branch properties
        if (body.name) {
          branch.name = body.name;
          branch.slug = slugify(body.name, { lower: true, strict: true });
        }

        // Update models JSON object
        if (body.models) {
          branch.models = body.models;
        }

        // Persist the changes to the database
        db.branch.update({
          where: { id: { equals: branch.id } },
          data: branch,
        });

        await delay(500);
        return HttpResponse.json(branch);
      } catch (error) {
        return new HttpResponse(
          error instanceof Error ? error.message : String(error),
          { status: 500 },
        );
      }
    },
  ),
];
