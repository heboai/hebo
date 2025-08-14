import { Elysia, t } from "elysia";

import { branches } from "@hebo/db/schema/branches";

import { agentPathParam } from "~/routes/agents";
import {
  createSchemaFactory,
  AUDIT_FIELDS,
  ID_FIELDS,
} from "~/utils/schema-factory";

const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
  typeboxInstance: t,
});

const OMIT_FIELDS = [...AUDIT_FIELDS, ...ID_FIELDS, "agentId"] as const;

const _insertSchema = createInsertSchema(branches);
const createBranch = createInsertSchema(branches, OMIT_FIELDS);
const updateBranch = createUpdateSchema(branches, OMIT_FIELDS);

// Ensure the path parameter types match the corresponding database field type
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
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      params: agentPathParam,
      body: createBranch,
      response: { 501: t.String() },
    },
  )
  .get(
    "/",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      params: agentPathParam,
      response: { 501: t.String() },
    },
  )
  .get(
    "/:branchSlug",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      params: branchPathParams,
      response: { 501: t.String() },
    },
  )
  .put(
    "/:branchSlug",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      params: branchPathParams,
      body: updateBranch,
      response: { 501: t.String() },
    },
  );
