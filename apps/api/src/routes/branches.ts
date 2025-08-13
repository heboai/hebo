import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { Elysia, t } from "elysia";

import { branches } from "@hebo/db/schema/branches";

import { selectAgent } from "./agents";
import { createModelSchemas } from "../utils";

const _selectBranch = createSelectSchema(branches);
const _insertBranch = createInsertSchema(branches);
const _updateBranch = createUpdateSchema(branches);
const { createSchema: createBranch, updateSchema: updateBranch } =
  createModelSchemas({ insert: _insertBranch, update: _updateBranch }, [
    "agentId",
  ]);

const selectBranch = t.Object({
  branchSlug: _selectBranch.properties.slug,
});

const selectBranchWithAgent = t.Object({
  ...selectAgent.properties,
  ...selectBranch.properties,
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
      params: selectAgent,
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
      params: selectAgent,
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
      params: selectBranchWithAgent,
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
      params: selectBranchWithAgent,
      body: updateBranch,
      response: { 501: t.String() },
    },
  );
