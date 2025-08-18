import { and, asc, eq, isNull } from "drizzle-orm";
import { Elysia, t, NotFoundError } from "elysia";

import { db } from "@hebo/db";
import { agents } from "@hebo/db/schema/agents";
import { branches } from "@hebo/db/schema/branches";
import supportedModels from "@hebo/shared-data/supported-models.json";

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

// The create agent schema accepts a default model name which is later used to insert the branch record for that agent.
const createAgent = t.Intersect([
  t.Omit(_createAgent, [...OMIT_FIELDS, "slug"]),
  t.Object({ defaultModel: t.String() }),
]);
const updateAgent = t.Omit(_updateAgent, [...OMIT_FIELDS, "slug"]);
const selectAgent = t.Omit(_selectAgent, [...OMIT_FIELDS]);

export const agentPathParam = t.Object({
  agentSlug: _createAgent.properties.slug,
});

const SupportedModelNames = new Set(supportedModels.map((m) => m.name));

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
})
  .post(
    "/",
    async ({ body, set }) => {
      // TODO: replace with actual user id coming from auth
      const [createdBy, updatedBy] = ["dummy", "dummy"];
      const slug = createSlug(body.name, true);

      const { defaultModel, ...agentData } = body;

      if (!SupportedModelNames.has(defaultModel)) {
        set.status = 400;
        throw new Error("Invalid model name");
      }

      const model = {
        alias: "default",
        type: defaultModel,
      };

      // Insert the agent record and its initial branch in a single transaction
      const agent = await db.transaction(async (tx) => {
        const [createdAgent] = await tx
          .insert(agents)
          .values({ ...agentData, slug, createdBy, updatedBy })
          .onConflictDoNothing()
          .returning();

        // TODO: Apply a fallback strategy with retries with different slugs
        if (!createdAgent) {
          set.status = 409;
          throw new Error("Agent with this name already exists");
        }

        await tx.insert(branches).values({
          agentId: createdAgent.id,
          name: "main",
          slug: "main",
          models: [model],
          createdBy,
          updatedBy,
        });

        return createdAgent;
      });

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
        .where(isNull(agents.deletedAt))
        .orderBy(asc(agents.createdAt));

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
