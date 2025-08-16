import { eq, isNull } from "drizzle-orm";
import { Elysia, t, NotFoundError } from "elysia";

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

// TODO: the following looks excessively verbose, can we simplify it?
const _createAgent = createInsertSchema(agents);
const _updateAgent = createUpdateSchema(agents);
const _selectAgent = createSelectSchema(agents);

const createAgent = t.Omit(_createAgent, [
  ...AUDIT_FIELDS,
  ...ID_FIELDS,
  "slug",
]);
const updateAgent = t.Omit(_updateAgent, [
  ...AUDIT_FIELDS,
  ...ID_FIELDS,
  "slug",
]);
const selectAgent = t.Omit(_selectAgent, [...AUDIT_FIELDS, ...ID_FIELDS]);

export const agentPathParam = t.Object({
  agentSlug: _createAgent.properties.slug,
});

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
  // TODO: add sanitization for the body string fields
})
  .post(
    "/",
    async ({ body, set }) => {
      // TODO: replace with actual user id coming from auth
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
      body: createAgent,
      response: { 201: selectAgent },
    },
  )
  .get(
    "/",
    async ({ set }) => {
      const agentList = await db
        .select()
        .from(agents)
        .where(isNull(agents.deletedAt));

      set.status = 200;
      return agentList;
    },
    {
      response: t.Array(selectAgent),
    },
  )
  .get(
    "/:agentSlug",
    async ({ params, set }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.slug, params.agentSlug));

      if (!agent) {
        throw new NotFoundError("Agent not found");
      }

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
      // TODO: replace with actual user id coming from auth
      const updatedBy = "dummy";
      const [agent] = await db
        .update(agents)
        .set({ ...body, updatedBy })
        .where(eq(agents.slug, params.agentSlug))
        .returning();

      if (!agent) {
        throw new NotFoundError("Agent not found");
      }

      set.status = 200;
      return agent;
    },
    {
      params: agentPathParam,
      body: updateAgent,
      response: selectAgent,
    },
  )
  .delete(
    "/:agentSlug",
    async ({ params, set }) => {
      // TODO: replace with actual user id coming from auth
      const deletedBy = "dummy";
      const deletedAt = new Date();

      await db
        .update(agents)
        .set({ deletedBy, deletedAt })
        .where(eq(agents.slug, params.agentSlug));

      set.status = 204;
    },
    {
      params: agentPathParam,
      response: { 204: t.Void() },
    },
  );
