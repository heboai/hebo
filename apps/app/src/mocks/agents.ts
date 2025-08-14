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
  http.post("/api/agents", async ({ request }) => {
    const body = (await request.json()) as Agent;

    const tmpAgent = {
      name: body.name,
      slug: slugify(body.name),
      branches: ["main"], // always create ['main'] by default
    };

    if (db.getCollection("agents").findBy({ slug: tmpAgent.slug })) {
      return new HttpResponse("Agent with the same name already exists", {
        status: 400,
      });
    }

    const newAgent = db.getCollection("agents").insert(tmpAgent);

    console.log(newAgent.slug);

    await delay(1500);
    return HttpResponse.json(newAgent, { status: 201 });
  }),

  http.get("/api/agents", async () => {
    const agents = db.getCollection("agents").records;

    await delay(1000);
    return HttpResponse.json(agents);
  }),
];
