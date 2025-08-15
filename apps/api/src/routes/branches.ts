import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

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

const _insertSchema = createInsertSchema(branches);
const createBranch = createInsertSchema(branches);
const updateBranch = createUpdateSchema(branches);
const selectBranch = createSelectSchema(branches);

const branchPathParams = t.Object({
  ...agentPathParam.properties,
  branchSlug: _insertSchema.properties.slug,
});

export const branchRoutes = new Elysia({
  name: "branch-routes",
  prefix: "/:agentSlug/branches",
})
  .post(
    "/",
    async ({ params, body, set }) => {
      const agentResult = await db
        .select()
        .from(agents)
        .where(eq(agents.slug, params.agentSlug));
      const agentId = agentResult[0].id;
      const createdBy = "dummy";
      const updatedBy = "dummy";
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
      body: t.Omit(createBranch, [...AUDIT_FIELDS, ...ID_FIELDS, "agentId", "slug"]),
      response: selectBranch,
    },
  )
  .get(
    "/",
    async ({ params, set }) => {
      const agentResult = await db
        .select()
        .from(agents)
        .where(eq(agents.slug, params.agentSlug));
      const agentId = agentResult[0].id;
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
    async ({ params, set }) => {
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.slug, params.branchSlug));
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
    async ({ body, params, set }) => {
      const updatedBy = "dummy";
      const [branch] = await db
        .update(branches)
        .set({ ...body, updatedBy })
        .where(eq(branches.slug, params.branchSlug))
        .returning();
      set.status = 200;
      return branch;
    },
    {
      params: branchPathParams,
      body: t.Omit(updateBranch, [...AUDIT_FIELDS, ...ID_FIELDS, "agentId", "slug"]),
      response: selectBranch,
    },
  );
