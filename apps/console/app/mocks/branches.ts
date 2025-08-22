import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~/mocks/db";

type ModelConfig = {
  alias: string;
  type: string;
  endpoint?: {
    baseUrl: string;
    provider: "aws" | "custom";
    apiKey: string;
  };
};

type ModelsData = {
  models: ModelConfig[];
  __supportedTypes: string[];
};

export const branchHandlers = [
  http.post<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ request, params }) => {
      const body = (await request.json()) as {
        name: string;
        models: ModelsData;
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
        models: body.models,
        agent: agent,
      };

      try {
        const createdBranch = db.branch.create(branch);
        // Return the branch without the agent relationship for API response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { agent, ...branchResponse } = createdBranch;

        await delay(200);
        return HttpResponse.json(branchResponse, { status: 201 });
      } catch {
        return new HttpResponse("Branch with the same name already exists", {
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
        .map((branch) => {
          // Remove the agent relationship from response
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { agent, ...branchResponse } = branch;
          return branchResponse;
        });

      await delay(1000);
      return HttpResponse.json(branches);
    },
  ),
];
