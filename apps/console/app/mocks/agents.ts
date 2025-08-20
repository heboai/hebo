import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~/mocks/db";

export const agentHandlers = [
  http.post("/api/v1/agents", async ({ request }) => {
    const body = (await request.json()) as ReturnType<typeof db.branch.create>;

    const agent = {
      name: body.name,
      slug: slugify(body.name, { lower: true, strict: true }),
      branches: ["main"], // always create ['main'] by default
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
      return new HttpResponse(undefined, { status: 204 });
    },
  ),
];
