import { http, HttpResponse, delay } from "msw";

import { db } from "~/mocks/db";

interface Agent {
  agentName: string;
  models: string;
  branches?: string[];
}

export const agentHandlers = [
  // Create a new agent
  http.post("/api/agents", async ({ request }) => {
    const body = (await request.json()) as Agent;

    if (db.getCollection("agents").findBy({ agentName: body.agentName })) {
      return HttpResponse.json(
        { error: "Agent with the same name already exists" },
        { status: 400 },
      );
    }

    const newAgent = db.getCollection("agents").insert({
      ...body,
      branches: ["main"], // always create ['main'] by default
    });

    await delay(1500);
    return HttpResponse.json(newAgent, { status: 201 });
  }),

  // Get all agents
  http.get("/api/agents", async () => {
    const agents = db.getCollection("agents").records;

    await delay(1000);
    return HttpResponse.json(agents);
  }),
];
