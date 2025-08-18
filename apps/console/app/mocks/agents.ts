import { http, HttpResponse, delay } from "msw";
import slugify from "slugify";

import { db } from "~/mocks/db";

if (!db.hasCollection("agents")) {
  db.createCollection("agents");
}

interface Agent {
  name: string;
  slug: string;
  branches?: string[];
}
export const agentHandlers = [
  http.post("/api/v1/agents", async ({ request }) => {
    const body = (await request.json()) as Agent;

    const tmpAgent = {
      id: crypto.randomUUID(),
      name: body.name,
      slug: slugify(body.name, { lower: true, strict: true }),
      branches: ["main"], // always create ['main'] by default
    };

    if (db.getCollection("agents").findBy({ slug: tmpAgent.slug })) {
      return new HttpResponse("Agent with the same name already exists", {
        status: 400,
      });
    }

    const newAgent = db.getCollection("agents").insert(tmpAgent);

    await delay(2000);
    return HttpResponse.json(newAgent, { status: 201 });
  }),

  http.get("/api/v1/agents", async () => {
    const agents = db.getCollection("agents").records;

    await delay(2000);
    return HttpResponse.json(agents);
  }),

  http.delete<{ agentSlug: string }>(
    "/api/v1/agents/:agentSlug",
    async ({ params }) => {
      const tmpAgent = {
        slug: params.agentSlug,
      };

      if (!db.getCollection("agents").findBy(tmpAgent)) {
        return new HttpResponse("Agent with the slug not found", {
          status: 400,
        });
      }

      db.getCollection("agents").remove(tmpAgent);

      await delay(2000);
      return new HttpResponse({ status: 201 });
    },
  ),
];
