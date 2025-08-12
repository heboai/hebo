import { createInsertSchema, createUpdateSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";

import { agents } from "@hebo/db/schema/agents";

import { branchRoutes } from "./branches";

const createAgent = createInsertSchema(agents);
const updateAgent = createUpdateSchema(agents);

const ErrorResponse = t.Object({ error: t.String() });

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
})
  .post(
    "/",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      body: createAgent,
      response: { 501: ErrorResponse },
    },
  )
  .get(
    "/",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      response: { 501: ErrorResponse },
    },
  )
  .get(
    "/:agentId",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      params: t.Object({ agentId: t.String() }),
      response: { 501: ErrorResponse },
    },
  )
  .put(
    "/:agentId",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      params: t.Object({ agentId: t.String() }),
      body: updateAgent,
      response: { 501: ErrorResponse },
    },
  )
  // hierarchical relationships between agents and branches
  .use(branchRoutes);
