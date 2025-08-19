import { Elysia, t } from "elysia";

import { db } from "@hebo/db";

import { agentId } from "~/middlewares/agent-id";
import { auditFields } from "~/middlewares/audit-fields";
import * as AgentsModel from "~/modules/agents/model";

import * as BranchesModel from "./model";
import { BranchService } from "./service";

export const branchesModule = new Elysia({
  name: "branches-module",
  prefix: "/:agentSlug/branches",
})
  .use(auditFields)
  .use(agentId)
  .decorate("db", db)
  .post(
    "/",
    // TODO:use ajv to validate the models field
    async ({ body, set, agentId, auditFields, db }) => {
      const branch = await BranchService.createBranch(
        db,
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
        201: BranchesModel.Branch,
        404: BranchesModel.AgentNotFound,
        409: BranchesModel.AlreadyExists,
      },
    },
  )
  .get(
    "/",
    async ({ set, agentId, db }) => {
      const list = await BranchService.listBranches(db, agentId);
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
    async ({ params, set, agentId, db }) => {
      const branch = await BranchService.getBranchBySlug(
        db,
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
    async ({ params, body, set, agentId, auditFields, db }) => {
      const branch = await BranchService.updateBranch(
        db,
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
        200: BranchesModel.Branch,
        404: t.Union([BranchesModel.AgentNotFound, BranchesModel.NotFound]),
      },
    },
  );
