import { Elysia, t } from "elysia";

import { agents } from "@hebo/db/schema/agents";

import {
  createSchemaFactory,
  AUDIT_FIELDS,
  ID_FIELDS,
} from "~/utils/schema-factory";

const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
  typeboxInstance: t,
});

const OMIT_FIELDS = [...AUDIT_FIELDS, ...ID_FIELDS] as const;

const _insertSchema = createInsertSchema(agents);
const createAgent = createInsertSchema(agents, OMIT_FIELDS);
const updateAgent = createUpdateSchema(agents, OMIT_FIELDS);

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
  )
  .delete(
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

  .delete("/:agentSlug", async () => {});
