import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~console/mocks/db";

export const agentHandlers = [
  http.post("/api/v1/agents", async ({ request }) => {
    const body = (await request.json()) as ReturnType<typeof db.agent.create>;
    const agentSlug = slugify(body.name, { lower: true, strict: true });
    // always create main branch by default
    const branch = db.branch.create({
      slug: "main",
      agentSlug: agentSlug,
      name: "main",
      models: [
        {
          alias: "default",
          type: body.defaultModel,
        },
      ],
    });

    const agent = {
      name: body.name,
      slug: agentSlug,
      branches: [branch],
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
      const expand = url.searchParams.get("expand");

      let agent;
      try {
        agent = db.agent.findFirst({
          where: { slug: { equals: params.agentSlug } },
          strict: true,
        });
      } catch {
        return new HttpResponse("Agent with the slug not found", {
          status: 404,
        });
      }

      await delay(500);

      return expand === "branches"
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
