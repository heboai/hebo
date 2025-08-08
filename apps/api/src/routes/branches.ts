import { and, eq, isNull } from "drizzle-orm";
import { createSchemaFactory } from "drizzle-typebox";
import { Elysia, t } from "elysia";

import { db } from "@hebo/db/drizzle";
import { agents } from "@hebo/db/schema/agents";
import { branches } from "@hebo/db/schema/branches";
import { SupportedLLMs, EndpointSchema } from "@hebo/db/schema/types/models";

import { authenticateUser } from "../middlewares/auth";

const { createSelectSchema } = createSchemaFactory({ typeboxInstance: t });

// Safe response schemas (omit apiKey from endpoint)
const ResponseEndpointSchema = t.Object({
  url: t.String({ format: "uri" }),
  provider: t.String(),
});

const ResponseModelSchema = t.Object({
  alias: t.String({ minLength: 1 }),
  // Use string here to avoid cross-instance Kind mismatches with external unions
  LLM: t.String(),
  endpoint: t.Optional(ResponseEndpointSchema),
});

const ResponseModelsSchema = t.Array(ResponseModelSchema, { minItems: 1 });

const SafeBranchSelect = createSelectSchema(branches, {
  models: ResponseModelsSchema,
});

// Runtime sanitizer to strip apiKey from models' endpoints
const sanitizeBranch = (row: typeof branches.$inferSelect) => {
  const sanitizedModels = row.models.map((model) => ({
    alias: model.alias,
    LLM: model.LLM,
    endpoint: model.endpoint
      ? { url: model.endpoint.url, provider: model.endpoint.provider }
      : undefined,
  }));

  return { ...row, models: sanitizedModels } as const;
};

// Allow alias to be optional on create/update bodies and default to "default" in handler
const CreateModelSchema = t.Object(
  {
    alias: t.Optional(t.String({ minLength: 1 })),
    LLM: SupportedLLMs,
    endpoint: t.Optional(EndpointSchema),
  },
  { additionalProperties: false },
);
const CreateModelsSchema = t.Array(CreateModelSchema, { minItems: 1 });

const CreateBranchBody = t.Object(
  {
    agent_id: t.Integer(),
    name: t.Optional(t.String({ minLength: 1 })),
    models: CreateModelsSchema,
  },
  { additionalProperties: false },
);

const UpdateBranchParams = t.Object(
  { id: t.Numeric() },
  { additionalProperties: false },
);
const UpdateModelSchema = CreateModelSchema;
const UpdateModelsSchema = t.Array(UpdateModelSchema, { minItems: 1 });

const UpdateBranchBody = t.Object(
  {
    agent_id: t.Integer(),
    name: t.String({ minLength: 1 }),
    models: UpdateModelsSchema,
  },
  { additionalProperties: false },
);

const GetBranchesParams = t.Object(
  { agent_id: t.Numeric() },
  { additionalProperties: false },
);

const ErrorResponse = t.Object(
  { error: t.String() },
  { additionalProperties: false },
);

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
      // TODO: implement guards to reduce code duplication
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

      const modelsWithDefaultAlias = body.models.map((m) => ({
        ...m,
        alias: m.alias ?? "default",
      }));

      // Validate alias uniqueness after defaults
      const seenAliases = new Set<string>();
      for (const model of modelsWithDefaultAlias) {
        if (seenAliases.has(model.alias)) {
          set.status = 422;
          return { error: `Duplicate model alias: ${model.alias}` } as const;
        }
        seenAliases.add(model.alias);
      }

      const payload: typeof branches.$inferInsert = {
        agent_id: body.agent_id,
        name: body.name ?? "main",
        models: modelsWithDefaultAlias,
      };

      const [row] = await db.insert(branches).values(payload).returning();
      const locationUrl = `/branches/${row.id}`;
      set.status = 201;
      (set.headers as Record<string, string>)["Location"] = locationUrl;
      return sanitizeBranch(row);
    },
    {
      body: CreateBranchBody,
      response: {
        201: SafeBranchSelect,
        401: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
    },
  )
  // Get branches by agent id
  .get(
    "/:agent_id",
    async ({ params, store, set }) => {
      const userId = store.userId as string | undefined;
      // TODO: implement guards to reduce code duplication
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" } as const;
      }

      const { agent_id } = params;

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
      return rows.map((row) => sanitizeBranch(row));
    },
    {
      params: GetBranchesParams,
      response: {
        200: t.Array(SafeBranchSelect),
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
      // TODO: implement guards to reduce code duplication
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

      const modelsWithDefaultAlias = body.models.map((m) => ({
        ...m,
        alias: m.alias ?? "default",
      }));

      // Validate alias uniqueness after defaults
      const seenAliases = new Set<string>();
      for (const model of modelsWithDefaultAlias) {
        if (seenAliases.has(model.alias)) {
          set.status = 422;
          return { error: `Duplicate model alias: ${model.alias}` } as const;
        }
        seenAliases.add(model.alias);
      }

      const [updated] = await db
        .update(branches)
        .set({ name: body.name, models: modelsWithDefaultAlias })
        .where(
          and(
            eq(branches.id, params.id),
            eq(branches.agent_id, body.agent_id),
            isNull(branches.deleted_at),
          ),
        )
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Branch not found" } as const;
      }
      return sanitizeBranch(updated);
    },
    {
      params: UpdateBranchParams,
      body: UpdateBranchBody,
      response: {
        200: SafeBranchSelect,
        401: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
    },
  );
