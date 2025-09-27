import Elysia from "elysia";

import { BranchRepo } from "@hebo/database/repository";
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
      return await BranchRepo(userId!).getAll(params.agentSlug);
    },
    {
      params: BranchesModel.AgentPathParam,
      response: { 200: BranchesModel.BranchList },
    },
  )
  .post(
    "/",
    // FUTURE: use Ajv to validate the models fields
    async ({ body, params, set, userId }) => {
      const branch = await BranchRepo(userId!).copy(
        params.agentSlug,
        body.sourceBranchSlug,
        body.name,
      );
      set.status = 201;
      return branch;
    },
    {
      params: BranchesModel.AgentPathParam,
      body: BranchesModel.CopyBody,
      response: { 201: BranchesModel.Branch },
    },
  )
  .get(
    "/:branchSlug",
    async ({ params, userId }) => {
      return await BranchRepo(userId!).getBySlug(
        params.agentSlug,
        params.branchSlug,
      );
    },
    {
      params: BranchesModel.PathParams,
      response: { 200: BranchesModel.Branch },
    },
  )
  .put(
    "/:branchSlug",
    async ({ body, params, userId }) => {
      return await BranchRepo(userId!).update(
        params.agentSlug,
        params.branchSlug,
        body.name,
        body.models,
      );
    },
    {
      params: BranchesModel.PathParams,
      body: BranchesModel.UpdateBody,
      response: { 200: BranchesModel.Branch },
    },
  )
  .delete(
    "/:branchSlug",
    async ({ params, set, userId }) => {
      await BranchRepo(userId!).softDelete(params.agentSlug, params.branchSlug);
      set.status = 204;
    },
    {
      params: BranchesModel.PathParams,
      response: { 204: BranchesModel.NoContent },
    },
  );
