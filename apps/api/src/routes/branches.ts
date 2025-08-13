import { Elysia } from "elysia";

import { selectAgent } from "../contracts/agents";
import {
  createBranch,
  selectBranchWithAgent,
  updateBranch,
} from "../contracts/branches";
import { ErrorResponse } from "../contracts/common";

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
      params: selectAgent,
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
      params: selectAgent,
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
      params: selectBranchWithAgent,
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
      params: selectBranchWithAgent,
      body: updateBranch,
      response: { 501: ErrorResponse },
    },
  );
