import { t } from "elysia";

import { Agent } from "@hebo/database/src/generated/prismabox/Agent";
import {
  Branch,
  BranchInputCreate,
  BranchInputUpdate,
} from "@hebo/database/src/generated/prismabox/Branch";

import { SupportedModelEnum } from "~api/modules/agents/model";

export { Branch } from "@hebo/database/src/generated/prismabox/Branch";

const BranchModels = t.Array(
  t.Object({ type: SupportedModelEnum }, { additionalProperties: true }),
);

// DTOs
export const CopyBody = t.Object({
  name: BranchInputCreate.properties.name,
  sourceBranchSlug: t.String(),
});
export const UpdateBody = t.Object({
  name: BranchInputUpdate.properties.name,
  models: t.Optional(BranchModels),
});
export const BranchList = t.Array(Branch);
export const AgentPathParam = t.Object({
  agentSlug: Agent.properties.slug,
});
export const PathParams = t.Object({
  ...AgentPathParam.properties,
  branchSlug: Branch.properties.slug,
});
export const NoContent = t.Void();

// Types
export type CopyBody = typeof CopyBody.static;
export type UpdateBody = typeof UpdateBody.static;
