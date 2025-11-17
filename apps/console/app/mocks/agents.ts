import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~console/mocks/db";

export const agentHandlers = [
  http.post("/api/v1/agents", async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      defaultModel: string;
    };

    // always create main branch by default
    const defaultBranch = db.branch.create({
      name: "Main",
      slug: "main",
      models: [
        {
          alias: "default",
          type: body.defaultModel,
        },
      ],
    });

    const agent = {
      name: body.name,
      slug: slugify(body.name, { lower: true, strict: true }),
      branches: [defaultBranch],
    };

    try {
      db.agent.create(agent);
    } catch {
      return new HttpResponse("Agent with the same name already exists", {
        status: 409,
      });
    }

    await delay(2000);
    return HttpResponse.json(agent, { status: 201 });
  }),

  http.get("/api/v1/agents", async () => {
    const agents = db.agent.getAll();

    await delay(1000);
    return HttpResponse.json(agents);
  }),

  http.get<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug",
    async ({ params, request }) => {
      const url = new URL(request.url);
      const branchesInclude = url.searchParams.get("branches");

      const agent = db.agent.findFirst({
        where: { slug: { equals: params.agentSlug } },
      });

      if (!agent)
        return new HttpResponse("Agent with the slug not found", {
          status: 404,
        });

      await delay(500);

      return branchesInclude === "true"
        ? HttpResponse.json(agent)
        : HttpResponse.json({ ...agent, branches: [] });
    },
  ),

  http.delete<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug",
    async ({ params }) => {
      try {
        db.agent.delete({
          where: { slug: { equals: params.agentSlug } },
          strict: true,
        });
      } catch {
        return new HttpResponse("Agent with the slug not found", {
          status: 404,
        });
      }

      await delay(500);
      return new HttpResponse(undefined, { status: 200 });
    },
  ),
];
