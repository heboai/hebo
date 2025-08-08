import { and, eq, isNull } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@hebo/db/drizzle";
import { agents } from "@hebo/db/schema/agents";
import { branches } from "@hebo/db/schema/branches";
import {
  Model,
  Models,
  SupportedLLMs,
  EndpointSchema,
} from "@hebo/db/schema/types/models";

import { authenticateUser } from "../middlewares/auth";
import { BranchSelect } from "../schema/branches.schemas";

// Allow alias to be optional on create/update bodies and default to "default" in handler
const CreateModelSchema = t.Object({
  alias: t.Optional(t.String({ minLength: 1 })),
  LLM: SupportedLLMs,
  endpoint: t.Optional(EndpointSchema),
});
const CreateModelsSchema = t.Array(CreateModelSchema, { minItems: 1 });

const CreateBranchBody = t.Object({
  agent_id: t.Number(),
  name: t.Optional(t.String({ minLength: 1 })),
  models: CreateModelsSchema,
});

const UpdateBranchParams = t.Object({ id: t.Number() });
const UpdateModelSchema = CreateModelSchema;
const UpdateModelsSchema = t.Array(UpdateModelSchema, { minItems: 1 });

const UpdateBranchBody = t.Object({
  agent_id: t.Number(),
  name: t.String({ minLength: 1 }),
  models: UpdateModelsSchema,
});

const GetBranchesParams = t.Object({ agent_id: t.Number() });

const ErrorResponse = t.Object({ error: t.String() });

export const branchRoutes = new Elysia({
  name: "branch-routes",
  prefix: "/branches",
})
  .use(authenticateUser)
  // Create branch
  .post(
    "/",
    async ({ body, store, set }) => {
      const userId = store.userId as string | undefined;
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" } as const;
      }

      const [agentRow] = await db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.id, body.agent_id),
            eq(agents.user_id, userId),
            isNull(agents.deleted_at),
          ),
        );

      if (!agentRow) {
        set.status = 404;
        return { error: "Agent not found for user" } as const;
      }

      const modelsWithDefaultAlias = (body.models as Models).map((m) => ({
        ...m,
        alias: (m as Model).alias ?? "default",
      })) as Models;

      const payload: typeof branches.$inferInsert = {
        agent_id: body.agent_id,
        name: body.name ?? "main",
        models: modelsWithDefaultAlias,
      };

      const [row] = await db.insert(branches).values(payload).returning();
      return row;
    },
    {
      body: CreateBranchBody,
      response: { 200: BranchSelect, 401: ErrorResponse, 404: ErrorResponse },
    },
  )
  // Get branches by agent id
  .get(
    "/:agent_id",
    async ({ params, store, set }) => {
      const userId = store.userId as string | undefined;
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" } as const;
      }

      const { agent_id } = params as { agent_id: number };

      const [agentRow] = await db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.id, agent_id),
            eq(agents.user_id, userId),
            isNull(agents.deleted_at),
          ),
        );

      if (!agentRow) {
        set.status = 404;
        return { error: "Agent not found for user" } as const;
      }

      const rows = await db
        .select()
        .from(branches)
        .where(
          and(eq(branches.agent_id, agent_id), isNull(branches.deleted_at)),
        );
      return rows;
    },
    {
      params: GetBranchesParams,
      response: {
        200: t.Array(BranchSelect),
        401: ErrorResponse,
        404: ErrorResponse,
      },
    },
  )
  // Update branch
  .put(
    "/:id",
    async ({ params, body, store, set }) => {
      const userId = store.userId as string | undefined;
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" } as const;
      }

      const [agentRow] = await db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.id, body.agent_id),
            eq(agents.user_id, userId),
            isNull(agents.deleted_at),
          ),
        );

      if (!agentRow) {
        set.status = 404;
        return { error: "Agent not found for user" } as const;
      }

      const modelsWithDefaultAlias = (body.models as Models).map((m) => ({
        ...m,
        alias: (m as Model).alias ?? "default",
      })) as Models;

      const [updated] = await db
        .update(branches)
        .set({ name: body.name, models: modelsWithDefaultAlias })
        .where(
          and(eq(branches.id, params.id), eq(branches.agent_id, body.agent_id)),
        )
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Branch not found" } as const;
      }

      return updated;
    },
    {
      params: UpdateBranchParams,
      body: UpdateBranchBody,
      response: { 200: BranchSelect, 401: ErrorResponse, 404: ErrorResponse },
    },
  );
