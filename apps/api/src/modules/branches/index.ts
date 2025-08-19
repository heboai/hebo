import { Elysia, t } from "elysia";

import { agentId } from "~/middlewares/agent-id";
import { auditFields } from "~/middlewares/audit-fields";
import * as AgentsModel from "~/modules/agents/model";
import { withRequestTransaction } from "~/utils/request-db";

import * as BranchesModel from "./model";
import { BranchService } from "./service";

export const branchesModule = new Elysia({
  name: "branches-module",
  prefix: "/:agentSlug/branches",
})
  .use(auditFields)
  .use(agentId)
  .post(
    "/",
    // TODO:use ajv to validate the models field
    withRequestTransaction(async ({ body, set, agentId, auditFields }) => {
      const branch = await BranchService.createBranch(
        agentId,
        body,
        auditFields,
      );
      set.status = 201;
      return branch;
    }),
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
    async ({ set, agentId }) => {
      const list = await BranchService.listBranches(agentId);
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
        200: BranchesModel.Branch,
        404: t.Union([BranchesModel.AgentNotFound, BranchesModel.NotFound]),
      },
    },
  )
  .put(
    "/:branchSlug",
    withRequestTransaction(
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
    ),
    {
      params: BranchesModel.PathParams,
      body: BranchesModel.UpdateBody,
      response: {
        200: BranchesModel.Branch,
        404: t.Union([BranchesModel.AgentNotFound, BranchesModel.NotFound]),
      },
    },
  );
