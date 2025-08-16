import { and, eq, isNull } from "drizzle-orm";
import { Elysia, t, NotFoundError } from "elysia";

import { db } from "@hebo/db";
import { branches } from "@hebo/db/schema/branches";

import { agentPathParam } from "~/routes/agents";
import { createSlug } from "~/utils/create-slug";
import {
  createSchemaFactory,
  AUDIT_FIELDS,
  ID_FIELDS,
} from "~/utils/schema-factory";
import { verifyAgent } from "~/utils/verify-agent";

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
  createSchemaFactory({
    typeboxInstance: t,
  });

const _createBranch = createInsertSchema(branches);
const _updateBranch = createUpdateSchema(branches);
const _selectBranch = createSelectSchema(branches);

const OMIT_FIELDS = [...AUDIT_FIELDS, ...ID_FIELDS, "agentId"] as const;

const createBranch = t.Omit(_createBranch, [...OMIT_FIELDS, "slug"]);
const updateBranch = t.Omit(_updateBranch, [...OMIT_FIELDS, "slug"]);
const selectBranch = t.Omit(_selectBranch, [...OMIT_FIELDS]);

const branchPathParams = t.Object({
  ...agentPathParam.properties,
  branchSlug: _createBranch.properties.slug,
});

export const branchRoutes = new Elysia({
  name: "branch-routes",
  prefix: "/:agentSlug/branches",
})
  .post(
    "/",
    async ({ params, body, set }) => {
      const agent = await verifyAgent(params.agentSlug);

      const agentId = agent.id;
      // TODO: replace with actual user id coming from auth
      const [createdBy, updatedBy] = ["dummy", "dummy"];
      const slug = createSlug(body.name);
      // TODO: handle DB errors in case of slug collision
      const [branch] = await db
        .insert(branches)
        .values({ agentId, ...body, slug, createdBy, updatedBy })
        .returning();
      set.status = 201;
      return branch;
    },
    {
      params: agentPathParam,
      body: createBranch,
      response: { 201: selectBranch },
    },
  )
  .get(
    "/",
    // TODO: type models to solve Elysia type error
    async ({ params, set }) => {
      const agent = await verifyAgent(params.agentSlug);

      const agentId = agent.id;
      const branchList = await db
        .select()
        .from(branches)
        .where(and(eq(branches.agentId, agentId), isNull(branches.deletedAt)));
      set.status = 200;
      return branchList;
    },
    {
      params: agentPathParam,
      response: t.Array(selectBranch),
    },
  )
  .get(
    "/:branchSlug",
    // TODO: type models to solve Elysia type error
    async ({ params, set }) => {
      const agent = await verifyAgent(params.agentSlug);

      const agentId = agent.id;
      const [branch] = await db
        .select()
        .from(branches)
        .where(
          and(
            eq(branches.slug, params.branchSlug),
            eq(branches.agentId, agentId),
            isNull(branches.deletedAt),
          ),
        );

      if (!branch) {
        throw new NotFoundError("Branch not found");
      }

      set.status = 200;
      return branch;
    },
    {
      params: branchPathParams,
      response: selectBranch,
    },
  )
  .put(
    "/:branchSlug",
    // TODO: type models to solve Elysia type error
    async ({ body, params, set }) => {
      const agent = await verifyAgent(params.agentSlug);

      const agentId = agent.id;
      // TODO: replace with actual user id coming from auth
      const updatedBy = "dummy";
      const [branch] = await db
        .update(branches)
        .set({ ...body, updatedBy })
        .where(
          and(
            eq(branches.slug, params.branchSlug),
            eq(branches.agentId, agentId),
            isNull(branches.deletedAt),
          ),
        )
        .returning();

      if (!branch) {
        throw new NotFoundError("Branch not found");
      }

      set.status = 200;
      return branch;
    },
    {
      params: branchPathParams,
      body: updateBranch,
      response: selectBranch,
    },
  );
