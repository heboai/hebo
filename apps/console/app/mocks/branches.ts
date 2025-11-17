import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~console/mocks/db";

export const branchHandlers = [
  http.post<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ request, params }) => {
      const body = (await request.json()) as {
        name: string;
        sourceBranchSlug: string;
      };
      const branchSlug = slugify(body.name, { lower: true, strict: true });

      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });

      if (!agent)
        return new HttpResponse("Agent with the slug not found", {
          status: 404,
        });

      const existingBranch = agent.branches.find((b) => b.slug === body.name);
      if (existingBranch)
        return new HttpResponse(
          "Branch with the slug already exists for this agent",
          {
            status: 409,
          },
        );

      const sourceBranch = agent.branches.find(
        (b) => b.slug === body.sourceBranchSlug,
      );
      if (!sourceBranch)
        return new HttpResponse("Can't find source branch", {
          status: 404,
        });

      const newBranch = db.branch.create({
        slug: branchSlug,
        name: body.name,
        models: structuredClone(sourceBranch.models),
      });

      db.agent.update({
        where: { slug: { equals: params.agentSlug } },
        data: {
          branches: [...agent.branches, newBranch],
        },
      });

      await delay(200);
      return HttpResponse.json(newBranch, { status: 201 });
    },
  ),

  http.get<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug/branches",
    async ({ params }) => {
      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });

      if (!agent)
        return new HttpResponse("Agent with the slug not found", {
          status: 404,
        });

      await delay(1000);
      return HttpResponse.json(agent.branches);
    },
  ),

  http.patch<{ agentSlug: string; branchSlug: string }>(
    "/api/v1/agents/:agentSlug/branches/:branchSlug",
    async ({ params, request }) => {
      const body = (await request.json()) as {
        models: ReturnType<typeof db.branch.create>["models"];
      };

      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });

      if (!agent)
        return new HttpResponse("Agent with the slug not found", {
          status: 404,
        });

      const updatedBranches = agent.branches.map((branch) =>
        branch.slug === params.branchSlug ? { ...branch, ...body } : branch,
      );

      const updatedAgent = db.agent.update({
        where: { slug: { equals: params.agentSlug } },
        data: {
          branches: updatedBranches,
        },
      });

      const updatedBranch = updatedAgent!.branches.find(
        (b) => b.slug === params.branchSlug,
      );

      await delay(500);
      return HttpResponse.json(updatedBranch);
    },
  ),

  http.delete<{ agentSlug: string; branchSlug: string }>(
    "/api/v1/agents/:agentSlug/branches/:branchSlug",
    async ({ params }) => {
      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });

      if (!agent)
        return new HttpResponse("Agent with the slug not found", {
          status: 404,
        });

      const branch = agent.branches.find((b) => b.slug === params.branchSlug);

      if (!branch) {
        return new HttpResponse("Branch not found on this agent", {
          status: 404,
        });
      }

      db.branch.delete({
        where: { id: { equals: branch.id } },
      });

      db.agent.update({
        where: { slug: { equals: params.agentSlug } },
        data: {
          branches: agent.branches.filter((b) => b.slug !== params.branchSlug),
        },
      });

      await delay(500);
      return new HttpResponse(undefined, { status: 200 });
    },
  ),
];
