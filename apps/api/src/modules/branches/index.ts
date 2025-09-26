import { Elysia } from "elysia";

import {
  copyBranch,
  getAllBranches,
  getBranchBySlug,
  updateBranch,
} from "@hebo/database/repository";
import { authService } from "@hebo/shared-api/auth/auth-service";

import * as BranchesModel from "./model";

export const branchesModule = new Elysia({
  name: "branches-module",
  prefix: "/:agentSlug/branches",
})
  .use(authService)
  .get(
    "/",
    async ({ params, userId }) => {
      return await getAllBranches(params.agentSlug, userId!);
    },
    {
      params: BranchesModel.AgentPathParam,
      response: BranchesModel.BranchList,
    },
  )
  .post(
    "/",
    // FUTURE: use Ajv to validate the models fields
    async ({ body, params, set, userId }) => {
      const branch = await copyBranch(
        params.agentSlug,
        body.sourceBranchSlug,
        body.name,
        userId!,
      );
      set.status = 201;
      return branch;
    },
    {
      params: BranchesModel.AgentPathParam,
      body: BranchesModel.CopyBody,
      response: {
        201: BranchesModel.Branch,
      },
    },
  )
  .get(
    "/:branchSlug",
    async ({ params, userId }) => {
      const branch = await getBranchBySlug(
        params.agentSlug,
        params.branchSlug,
        userId!,
      );
      return branch;
    },
    {
      params: BranchesModel.PathParams,
      response: {
        200: BranchesModel.Branch,
      },
    },
  )
  .put(
    "/:branchSlug",
    async ({ body, params, userId }) => {
      const branch = await updateBranch(
        params.agentSlug,
        params.branchSlug,
        body.name,
        body.models,
        userId!,
      );
      return branch;
    },
    {
      params: BranchesModel.PathParams,
      body: BranchesModel.UpdateBody,
      response: {
        200: BranchesModel.Branch,
      },
    },
  );
