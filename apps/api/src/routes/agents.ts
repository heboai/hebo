import { eq } from "drizzle-orm";
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
      const [createdBy, updatedBy] = ["dummy", "dummy"];
      const slug = createSlug(body.name, true);

      const [agent] = await db
        .insert(agents)
        .values({ ...body, slug, createdBy, updatedBy })
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
      const agentList = await db.select().from(agents);
      set.status = 200;
      return agentList;
    },
    {
      response: [selectAgent],
    },
  )
  .get(
    "/:agentSlug",
    async ({ params, set }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.slug, params.agentSlug));
      set.status = 200;
      return agent;
    },
    {
      params: agentPathParam,
      response: selectAgent,
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, params, set }) => {
      const updatedBy = "dummy";
      const [agent] = await db
        .update(agents)
        .set({ ...body, updatedBy })
        .where(eq(agents.slug, params.agentSlug))
        .returning();
      set.status = 200;
      return agent;
    },
    {
      params: agentPathParam,
      body: t.Omit(updateAgent, [...AUDIT_FIELDS, ...ID_FIELDS]),
      response: selectAgent,
    },
  )
  .delete(
    "/:agentSlug",
    async ({ params, set }) => {
      const deletedBy = "dummy";
      const deletedAt = new Date();
      const [agent] = await db
        .update(agents)
        .set({ deletedBy, deletedAt })
        .where(eq(agents.slug, params.agentSlug))
        .returning();
      set.status = 200;
      return agent;
    },
    {
      params: agentPathParam,
      response: selectAgent,
    },
  );
