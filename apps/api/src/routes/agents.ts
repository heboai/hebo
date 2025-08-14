import { Elysia, t } from "elysia";

import { db } from "@hebo/db";
import { agents } from "@hebo/db/schema/agents";

import { createSlug } from "~/utils/create-slug";
import {
  createSchemaFactory,
  AUDIT_FIELDS,
  ID_FIELDS,
} from "~/utils/schema-factory";

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
  createSchemaFactory({
    typeboxInstance: t,
  });

const _insertSchema = createInsertSchema(agents);
const createAgent = createInsertSchema(agents);
const updateAgent = createUpdateSchema(agents);
const selectAgent = createSelectSchema(agents);

export const agentPathParam = t.Object({
  agentSlug: _insertSchema.properties.slug,
});

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
  // TODO: add sanitization for the body string fields
})
  .post(
    "/",
    async ({ body, set }) => {
      const createdBy = "dummy";
      const updatedBy = "dummy";
      const name = body.name;
      const slug = createSlug(name, true);

      const [agent] = await db
        .insert(agents)
        .values({ name, slug, createdBy, updatedBy })
        .returning();

      set.status = 201;
      return agent;
    },
    {
      body: t.Omit(createAgent, [...AUDIT_FIELDS, ...ID_FIELDS]),
      response: selectAgent,
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
