import { Elysia, t } from "elysia";

import { createBranchRepo } from "@hebo/database/repository";
import {
  Branch,
  BranchInputCreate,
  BranchInputUpdate,
} from "@hebo/database/src/generated/prismabox/Branch";
import { authService } from "@hebo/shared-api/auth/auth-service";

import { SupportedModelEnum } from "~api/modules/agents";

export const branchesModule = new Elysia({
  prefix: "/:agentSlug/branches",
})
  .use(authService)
  .get(
    "/",
    async ({ params, userId }) => {
      return createBranchRepo(userId!, params.agentSlug).getAll();
    },
    {
      response: { 200: t.Array(Branch) },
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
      body: t.Object({
        name: BranchInputCreate.properties.name,
        sourceBranchSlug: t.String(),
      }),
      response: { 201: Branch },
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
      response: { 200: Branch },
    },
  )
  .patch(
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
      body: t.Object({
        name: t.Optional(BranchInputUpdate.properties.name),
        models: t.Optional(
          t.Array(
            t.Object(
              { type: SupportedModelEnum },
              { additionalProperties: true },
            ),
          ),
        ),
      }),
      response: { 200: Branch },
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
      response: { 204: t.Void() },
    },
  );
