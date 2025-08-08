import { and, eq, isNull } from "drizzle-orm";
import { createSchemaFactory } from "drizzle-typebox";
import { Elysia, t } from "elysia";

import { db } from "@hebo/db/drizzle";
import { agents } from "@hebo/db/schema/agents";

import { authenticateUser } from "../middlewares/auth";

const { createSelectSchema } = createSchemaFactory({ typeboxInstance: t });

const AgentSelect = createSelectSchema(agents);

const CreateAgentBody = t.Object(
  {
    name: t.String({ minLength: 1, maxLength: 128, examples: ["Hebo"] }),
  },
  { additionalProperties: false },
);

const UpdateAgentParams = t.Object(
  {
    id: t.Numeric(),
  },
  { additionalProperties: false },
);

const UpdateAgentBody = t.Object(
  {
    name: t.String({ minLength: 1, maxLength: 128, examples: ["Hebo"] }),
  },
  { additionalProperties: false },
);

const ErrorResponse = t.Object({ error: t.String() });

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
})
  .use(authenticateUser)
  // Create agent
  .post(
    "/",
    async ({ body, store, set }) => {
      const userId = store.userId as string | undefined;
      // TODO: implement guards to reduce code duplication
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" } as const;
      }

      const payload: typeof agents.$inferInsert = {
        name: body.name,
        user_id: userId,
      };

      const [row] = await db.insert(agents).values(payload).returning();
      set.status = 201;
      (set.headers as Record<string, string>)["Location"] = `/agents/${row.id}`;
      return row;
    },
    {
      body: CreateAgentBody,
      response: { 201: AgentSelect, 401: ErrorResponse },
    },
  )
  // Get all agents for current user
  .get(
    "/",
    async ({ store, set }) => {
      const userId = store.userId as string | undefined;
      // TODO: implement guards to reduce code duplication
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" } as const;
      }

      const rows = await db
        .select()
        .from(agents)
        .where(and(eq(agents.user_id, userId), isNull(agents.deleted_at)));
      return rows;
    },
    {
      response: { 200: t.Array(AgentSelect), 401: ErrorResponse },
    },
  )
  // Update agent name
  .put(
    "/:id",
    async ({ params, body, store, set }) => {
      const userId = store.userId as string | undefined;
      // TODO: implement guards to reduce code duplication
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" } as const;
      }

      const [updated] = await db
        .update(agents)
        .set({ name: body.name })
        .where(
          and(
            eq(agents.id, params.id),
            eq(agents.user_id, userId),
            isNull(agents.deleted_at),
          ),
        )
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Agent not found" } as const;
      }

      return updated;
    },
    {
      params: UpdateAgentParams,
      body: UpdateAgentBody,
      response: { 200: AgentSelect, 401: ErrorResponse, 404: ErrorResponse },
    },
  );
