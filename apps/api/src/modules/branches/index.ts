import { Elysia, t } from "elysia";

import * as AgentsModel from "~/modules/agents/model";

import * as BranchesModel from "./model";
import { BranchService } from "./service";

export const branchesModule = new Elysia({
  name: "branches-module",
  prefix: "/:agentSlug/branches",
})
  .post(
    "/",
    // TODO:use ajv to validate the models field
    async ({ params, body, set }) => {
      const branch = await BranchService.createBranch(params.agentSlug, body);
      set.status = 201;
      return branch;
    },
    {
      params: AgentsModel.PathParam,
      body: BranchesModel.CreateBody,
      response: {
        201: BranchesModel.Item,
        404: BranchesModel.AgentNotFound,
        409: BranchesModel.AlreadyExists,
      },
    },
  )
  .get(
    "/",
    async ({ params, set }) => {
      const list = await BranchService.listBranches(params.agentSlug);
      set.status = 200;
      return list;
    },
    {
      params: AgentsModel.PathParam,
      response: BranchesModel.ItemList,
    },
  )
  .get(
    "/:branchSlug",
    async ({ params, set }) => {
      const branch = await BranchService.getBranchBySlug(
        params.agentSlug,
        params.branchSlug,
      );
      set.status = 200;
      return branch;
    },
    {
      params: BranchesModel.PathParams,
      response: {
        200: BranchesModel.Item,
        404: t.Union([BranchesModel.AgentNotFound, BranchesModel.NotFound]),
      },
    },
  )
  .put(
    "/:branchSlug",
    async ({ params, body, set }) => {
      const branch = await BranchService.updateBranch(
        params.agentSlug,
        params.branchSlug,
        body,
      );
      set.status = 200;
      return branch;
    },
    {
      params: BranchesModel.PathParams,
      body: BranchesModel.UpdateBody,
      response: {
        200: BranchesModel.Item,
        404: t.Union([BranchesModel.AgentNotFound, BranchesModel.NotFound]),
      },
    },
  );
