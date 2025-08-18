import { Elysia, t } from "elysia";

import * as AgentsModel from "~/modules/agents/model";
import { getAuditFields } from "~/modules/get-audit-fields";
import { verifyAgent } from "~/modules/verify-agent";

import * as BranchesModel from "./model";
import { BranchService } from "./service";

export const branchesModule = new Elysia({
  name: "branches-module",
  prefix: "/:agentSlug/branches",
})
  .use(getAuditFields)
  .use(verifyAgent)
  .post(
    "/",
    // TODO:use ajv to validate the models field
    async ({ body, set, agentId, auditFields }) => {
      const branch = await BranchService.createBranch(
        agentId,
        body,
        auditFields,
      );
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
    async ({ set, agentId }) => {
      const list = await BranchService.listBranches(agentId);
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
    async ({ params, set, agentId }) => {
      const branch = await BranchService.getBranchBySlug(
        agentId,
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
    async ({ params, body, set, agentId, auditFields }) => {
      const branch = await BranchService.updateBranch(
        agentId,
        params.branchSlug,
        body,
        auditFields,
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
