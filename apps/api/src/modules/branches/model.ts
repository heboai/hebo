import { t } from "elysia";

import { branches } from "@hebo/db/schema/branches";

import * as AgentsModel from "~api/modules/agents/model";
import {
  createSchemaFactory,
  AUDIT_FIELDS,
  ID_FIELDS,
} from "~api/utils/schema-factory";

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
  createSchemaFactory({ typeboxInstance: t });

const _createBranch = createInsertSchema(branches);
const _updateBranch = createUpdateSchema(branches);
const _selectBranch = createSelectSchema(branches);

const OMIT_FIELDS = [...AUDIT_FIELDS, ...ID_FIELDS, "agentId"] as const;

// DTOs
export const CreateBody = t.Omit(_createBranch, [...OMIT_FIELDS, "slug"]);
export type CreateBody = typeof CreateBody.static;

export const UpdateBody = t.Omit(_updateBranch, [...OMIT_FIELDS, "slug"]);
export type UpdateBody = typeof UpdateBody.static;

export const Branch = t.Omit(_selectBranch, [...OMIT_FIELDS]);

export const BranchList = t.Array(Branch);

export const PathParams = t.Object({
  ...AgentsModel.PathParam.properties,
  branchSlug: _createBranch.properties.slug,
});

// Error DTOs
export const AlreadyExists = t.Literal("Branch with this name already exists");

export const NotFound = t.Literal("Branch not found");

export const AgentNotFound = t.Literal("Agent not found");
