import { Elysia, t } from "elysia";

import { branches } from "@hebo/db/schema/branches";

import { agentPathParam } from "./agents";
import {
  createInsertSchema,
  createCustomInsertSchema,
  createCustomUpdateSchema,
} from "../utils/schema-factory";

const _insertSchema = createInsertSchema(branches);
const createBranch = createCustomInsertSchema(branches, ["agentId"]);
const updateBranch = createCustomUpdateSchema(branches, ["agentId"]);

// Ensure the path parameter type matches the corresponding database field type
const branchPathParam = t.Object({
  branchSlug: _insertSchema.properties.slug,
});

const branchWithAgentPathParam = t.Object({
  ...agentPathParam.properties,
  ...branchPathParam.properties,
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
      params: branchWithAgentPathParam,
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
      params: branchWithAgentPathParam,
      body: updateBranch,
      response: { 501: t.String() },
    },
  );
