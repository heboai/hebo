import { Elysia, status, t } from "elysia";

import * as Repository from "@hebo/database/repository";
import { authService } from "@hebo/shared-api/auth/auth-service";

import { agentSlug, branchSlug } from "~api/middlewares/slugs";

import * as BranchesModel from "./model";

export const branchesModule = new Elysia({
  name: "branches-module",
  prefix: "/:agentSlug/branches",
})
  .use(authService)
  .use(agentSlug)
  .post(
    "/",
    // FUTURE: use Ajv to validate the models field
    async ({ body, set, agentSlug, userId }) => {
      const branch = await Repository.copyBranch(
        agentSlug,
        body.sourceBranchSlug,
        body.name,
        userId!,
      );
      if (!branch) {
        throw status(404, BranchesModel.NotFound.const);
      }
      set.status = 201;
      return branch;
    },
    {
      params: BranchesModel.AgentPathParam,
      body: BranchesModel.CopyBody,
      response: {
        201: BranchesModel.Branch,
        404: BranchesModel.AgentNotFound,
        409: BranchesModel.AlreadyExists,
      },
    },
  )
  .get(
    "/",
    async ({ set, agentSlug, userId }) => {
      const list = await Repository.getAllBranches(agentSlug, userId!);
      set.status = 200;
      return list;
    },
    {
      params: BranchesModel.AgentPathParam,
      response: BranchesModel.BranchList,
    },
  )
  .use(branchSlug)
  .get(
    "/:branchSlug",
    async ({ agentSlug, branchSlug, userId }) => {
      const branch = await Repository.getBranchBySlug(
        agentSlug,
        branchSlug,
        userId!,
      );
      if (!branch) {
        throw status(404, BranchesModel.NotFound.const);
      }
      return branch;
    },
    {
      params: BranchesModel.PathParams,
      response: {
        200: BranchesModel.Branch,
        404: t.Union([BranchesModel.AgentNotFound, BranchesModel.NotFound]),
      },
    },
  )
  .put(
    "/:branchSlug",
    async ({ body, agentSlug, branchSlug, userId }) => {
      const branch = await Repository.updateBranch(
        agentSlug,
        branchSlug,
        body.name!,
        body.models!,
        userId!,
      );
      return branch;
    },
    {
      params: BranchesModel.PathParams,
      body: BranchesModel.UpdateBody,
      response: {
        200: BranchesModel.Branch,
        404: t.Union([BranchesModel.AgentNotFound, BranchesModel.NotFound]),
      },
    },
  );
