import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~/mocks/db";

type ModelConfig = {
  alias: string;
  type: string;
};

type MockBranch = {
  id: string;
  agentId: string;
  slug: string;
  name: string;
  models: ModelConfig[];
  agent?: any;
};

// Helper to clean branch response like real API
const cleanBranchResponse = (branch: MockBranch) => ({
  name: branch.name,
  slug: branch.slug,
  models: branch.models,
  // Real API omits: id, agentId, createdAt, updatedAt, etc.
});

export const branchHandlers = [
  http.post<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ request, params }) => {
      const body = (await request.json()) as {
        name: string;
        models: ModelConfig[];
      };

      // Find the agent by slug to get the agentId
      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });

      if (!agent) {
        return new HttpResponse("Agent not found", { status: 404 });
      }

      const branch = {
        agentId: agent.id,
        name: body.name,
        slug: slugify(body.name, { lower: true, strict: true }),
        models: body.models.map((model) => ({
          alias: model.alias,
          type: model.type,
        })),
        agent: agent,
      };

      // Enforce unique (agentId, slug) like the real DB
      const dup = db.branch.findFirst({
        where: {
          agentId: { equals: agent.id },
          slug: { equals: branch.slug },
        },
      });

      if (dup) {
        return new HttpResponse("Branch already exists", { status: 409 });
      }

      try {
        const createdBranch = db.branch.create(branch);
        await delay(200);
        return HttpResponse.json(cleanBranchResponse(createdBranch), {
          status: 201,
        });
      } catch {
        return new HttpResponse("Unable to create branch", {
          status: 409,
        });
      }
    },
  ),

  http.get<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ params }) => {
      // Find the agent by slug to get the agentId
      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });

      if (!agent) {
        return new HttpResponse("Agent not found", { status: 404 });
      }

      // Get all branches for this agent
      const branches = db.branch
        .findMany({
          where: { agentId: { equals: agent.id } },
        })
        .map((branch) => cleanBranchResponse(branch)); // Clean each branch response

      await delay(1000);
      return HttpResponse.json(branches);
    },
  ),
];
