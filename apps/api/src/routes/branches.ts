import { eq } from "drizzle-orm";
import { Elysia, t, NotFoundError } from "elysia";

import { db } from "@hebo/db";
import { agents } from "@hebo/db/schema/agents";
import { branches } from "@hebo/db/schema/branches";

import { agentPathParam } from "~/routes/agents";
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
const _insertSchema = createInsertSchema(branches);
const _createBranch = createInsertSchema(branches);
const _updateBranch = createUpdateSchema(branches);
const _selectBranch = createSelectSchema(branches);

const createBranch = t.Omit(_createBranch, [
  ...AUDIT_FIELDS,
  ...ID_FIELDS,
  "agentId",
  "slug",
]);
const updateBranch = t.Omit(_updateBranch, [
  ...AUDIT_FIELDS,
  ...ID_FIELDS,
  "agentId",
  "slug",
]);
const selectBranch = t.Omit(_selectBranch, [
  ...AUDIT_FIELDS,
  ...ID_FIELDS,
  "agentId",
  "slug",
]);

const branchPathParams = t.Object({
  ...agentPathParam.properties,
  branchSlug: _insertSchema.properties.slug,
});

export const branchRoutes = new Elysia({
  name: "branch-routes",
  prefix: "/:agentSlug/branches",
  // TODO: add sanitization for the body string fields
})
  .post(
    "/",
    // TODO: type models to solve Elysia type error
    async ({ params, body, set }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.slug, params.agentSlug));

      if (!agent) {
        throw new NotFoundError("Agent not found");
      }

      const agentId = agent.id;
      // TODO: replace with actual user id coming from auth
      const [createdBy, updatedBy] = ["dummy", "dummy"];
      const slug = createSlug(body.name, false);
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
      response: selectBranch,
    },
  )
  .get(
    "/",
    async ({ params, set }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.slug, params.agentSlug));

      if (!agent) {
        throw new NotFoundError("Agent not found");
      }

      const agentId = agent.id;
      const branchList = await db
        .select()
        .from(branches)
        .where(eq(branches.agentId, agentId));
      set.status = 200;
      return branchList;
    },
    {
      params: agentPathParam,
      response: [selectBranch],
    },
  )
  .get(
    "/:branchSlug",
    // TODO: type models to solve Elysia type error
    async ({ params, set }) => {
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.slug, params.branchSlug));

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
      // TODO: replace with actual user id coming from auth
      const updatedBy = "dummy";
      const [branch] = await db
        .update(branches)
        .set({ ...body, updatedBy })
        .where(eq(branches.slug, params.branchSlug))
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
