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

const _insertSchema = createInsertSchema(agents);
const createAgent = createInsertSchema(agents);
const updateAgent = createUpdateSchema(agents);

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
      body: t.Omit(createAgent, [...AUDIT_FIELDS, ...ID_FIELDS]),
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
      body: t.Omit(updateAgent, [...AUDIT_FIELDS, ...ID_FIELDS]),
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
  );
