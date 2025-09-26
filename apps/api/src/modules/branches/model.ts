import { t } from "elysia";

import { Agent } from "@hebo/database/src/generated/prismabox/Agent";
import {
  Branch,
  BranchInputCreate,
  BranchInputUpdate,
} from "@hebo/database/src/generated/prismabox/Branch";
export { Branch } from "@hebo/database/src/generated/prismabox/Branch";

// DTOs
export const CopyBody = t.Composite([
  BranchInputCreate,
  t.Object({
    sourceBranchSlug: t.String(),
  }),
]);
export const UpdateBody = BranchInputUpdate;
export const BranchList = t.Array(Branch);
export const AgentPathParam = t.Object({
  agentSlug: Agent.properties.slug,
});
export const PathParams = t.Object({
  ...AgentPathParam.properties,
  branchSlug: Branch.properties.slug,
});

// Error DTOs
export const AlreadyExists = t.Literal("Branch with this name already exists");
export const NotFound = t.Literal("Branch not found");
export const AgentNotFound = t.Literal("Agent not found");

// Types
export type CopyBody = typeof CopyBody.static;
export type UpdateBody = typeof UpdateBody.static;
