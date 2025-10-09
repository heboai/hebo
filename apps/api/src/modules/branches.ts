import { Elysia, status, t } from "elysia";

import { createBranchRepo } from "@hebo/database/repository";
import {
  branches,
  branchesInputCreate,
  branchesInputUpdate,
} from "@hebo/database/src/generated/prismabox/branches";
import { authService } from "@hebo/shared-api/auth/auth-service";
import supportedModels from "@hebo/shared-data/json/supported-models";

export const supportedModelsUnion = t.Union(
  supportedModels.map(({ name }) => t.Literal(name)),
  {
    error() {
      return "Invalid model name";
    },
  },
);

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
      response: { 200: t.Array(branches) },
    },
  )
  .post(
    "/",
    async ({ body, params, userId }) => {
      const branch = await createBranchRepo(userId!, params.agentSlug).copy(
        body.sourceBranchSlug,
        body.name,
      );
      return status(201, branch);
    },
    {
      body: t.Object({
        name: branchesInputCreate.properties.name,
        sourceBranchSlug: t.String(),
      }),
      response: { 201: branches },
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
      response: { 200: branches },
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
        name: branchesInputUpdate.properties.name,
        models: t.Optional(
          t.Array(
            t.Object(
              { type: supportedModelsUnion },
              { additionalProperties: true },
            ),
          ),
        ),
      }),
      response: { 200: branches },
    },
  )
  .delete(
    "/:branchSlug",
    async ({ params, userId }) => {
      await createBranchRepo(userId!, params.agentSlug).softDelete(
        params.branchSlug,
      );
      return status(204);
    },
    {
      response: { 204: t.Void() },
    },
  );
