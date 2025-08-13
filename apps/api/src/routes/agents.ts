import { Elysia, t } from "elysia";

import { agents } from "@hebo/db/schema/agents";

import {
  createInsertSchema,
  createCustomInsertSchema,
  createCustomUpdateSchema,
} from "../utils/schema-factory";

const _insertSchema = createInsertSchema(agents);
const createAgent = createCustomInsertSchema(agents);
const updateAgent = createCustomUpdateSchema(agents);

// Ensure the path parameter type matches the corresponding database field type
export const agentPathParam = t.Object({
  agentSlug: _insertSchema.properties.slug,
});

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
})
  .post(
    "/",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      body: createAgent,
      response: { 501: t.String() },
    },
  )
  .get(
    "/",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      response: { 501: t.String() },
    },
  )
  .get(
    "/:agentSlug",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      params: agentPathParam,
      response: { 501: t.String() },
    },
  )
  .put(
    "/:agentSlug",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      params: agentPathParam,
      body: updateAgent,
      response: { 501: t.String() },
    },
  );
