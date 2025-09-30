import Elysia from "elysia";

import { createBranchRepo } from "@hebo/database/repository";
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
      return createBranchRepo(userId!, params.agentSlug).getAll();
    },
    {
      params: BranchesModel.AgentPathParam,
      response: { 200: BranchesModel.BranchList },
    },
  )
  .post(
    "/",
    async ({ body, params, set, userId }) => {
      const branch = createBranchRepo(userId!, params.agentSlug).copy(
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
      return createBranchRepo(userId!, params.agentSlug).getBySlug(
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
      // FUTURE: use Ajv to validate the models fields
      return createBranchRepo(userId!, params.agentSlug).update(
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
      await createBranchRepo(userId!, params.agentSlug).softDelete(
        params.branchSlug,
      );
      set.status = 204;
    },
    {
      params: BranchesModel.PathParams,
      response: { 204: BranchesModel.NoContent },
    },
  );
