import { and, eq, isNull } from "drizzle-orm";
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

const _createAgent = createInsertSchema(agents);
const _updateAgent = createUpdateSchema(agents);
const _selectAgent = createSelectSchema(agents);

const OMIT_FIELDS = [...AUDIT_FIELDS, ...ID_FIELDS] as const;

const createAgent = t.Omit(_createAgent, [...OMIT_FIELDS, "slug"]);
const updateAgent = t.Omit(_updateAgent, [...OMIT_FIELDS, "slug"]);
const selectAgent = t.Omit(_selectAgent, [...OMIT_FIELDS]);

export const agentPathParam = t.Object({
  agentSlug: _createAgent.properties.slug,
});

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
})
  // TODO: update method to accept and return what expected by the client
  .post(
    "/",
    async ({ body, set }) => {
      // TODO: replace with actual user id coming from auth
      const [createdBy, updatedBy] = ["dummy", "dummy"];
      const slug = createSlug(body.name, true);

      // TODO: handle DB errors in case of slug collision
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
  // TODO: include the 'expand' option
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
  // TODO: include the 'expand' option
  .get(
    "/:agentSlug",
    async ({ params, set }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(
          and(eq(agents.slug, params.agentSlug), isNull(agents.deletedAt)),
        );

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
        .where(and(eq(agents.slug, params.agentSlug), isNull(agents.deletedAt)))
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
        .where(
          and(eq(agents.slug, params.agentSlug), isNull(agents.deletedAt)),
        );

      set.status = 204;
    },
    {
      params: agentPathParam,
      response: { 204: t.Void() },
    },
  );
