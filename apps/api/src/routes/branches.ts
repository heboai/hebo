import { createInsertSchema, createUpdateSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";

import { branches } from "@hebo/db/schema/branches";

const createBranch = createInsertSchema(branches);
const updateBranch = createUpdateSchema(branches);

const ErrorResponse = t.Object({ error: t.String() });

export const branchRoutes = new Elysia({
  name: "branch-routes",
  prefix: "/:agentSlug/branches",
})
  .post(
    "/",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      params: t.Object({ agentSlug: t.String() }),
      body: createBranch,
      response: { 501: ErrorResponse },
    },
  )
  .get(
    "/",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      params: t.Object({ agentSlug: t.String() }),
      response: { 501: ErrorResponse },
    },
  )
  .get(
    "/:branchSlug",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      params: t.Object({ agentSlug: t.String(), branchSlug: t.String() }),
      response: { 501: ErrorResponse },
    },
  )
  .put(
    "/:branchSlug",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      params: t.Object({ agentSlug: t.String(), branchSlug: t.String() }),
      body: updateBranch,
      response: { 501: ErrorResponse },
    },
  );
