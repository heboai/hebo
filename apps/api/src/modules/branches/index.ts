import { Elysia, t } from "elysia";

import { authService } from "@hebo/shared-api/auth/auth-service";

import { agentId } from "~/middlewares/agent-id";
import * as AgentsModel from "~/modules/agents/model";

import * as BranchesModel from "./model";
import { BranchService } from "./service";

export const branchesModule = new Elysia({
  name: "branches-module",
  prefix: "/:agentSlug/branches",
})
  .use(authService)
  .use(agentId)
  .post(
    "/",
    // FUTURE: use Ajv to validate the models field
    async ({ body, set, agentId, userId }) => {
      const branch = await BranchService.createBranch(agentId, body, userId!);
      set.status = 201;
      return branch;
    },
    {
      params: AgentsModel.PathParam,
      body: BranchesModel.CreateBody,
      response: {
        201: BranchesModel.Branch,
        404: BranchesModel.AgentNotFound,
        409: BranchesModel.AlreadyExists,
      },
    },
  )
  .get(
    "/",
    async ({ set, agentId, userId }) => {
      const list = await BranchService.listBranches(agentId, userId!);
      set.status = 200;
      return list;
    },
    {
      params: AgentsModel.PathParam,
      response: BranchesModel.BranchList,
    },
  )
  .get(
    "/:branchSlug",
    async ({ params, set, agentId, userId }) => {
      const branch = await BranchService.getBranchBySlug(
        agentId,
        params.branchSlug,
        userId!,
      );
      set.status = 200;
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
    async ({ params, body, set, agentId, userId }) => {
      const branch = await BranchService.updateBranch(
        agentId,
        params.branchSlug,
        body,
        userId!,
      );
      set.status = 200;
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
