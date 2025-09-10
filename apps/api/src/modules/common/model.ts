import { t } from "elysia";

import { agents } from "@hebo/db/schema/agents";
import { branches } from "@hebo/db/schema/branches";

import {
  createSchemaFactory,
  AUDIT_FIELDS,
  ID_FIELDS,
} from "~api/utils/schema-factory";

const { createInsertSchema, createSelectSchema } = createSchemaFactory({
  typeboxInstance: t,
});

// Agent shared DTOs
const _createAgent = createInsertSchema(agents);

export const AgentPathParam = t.Object({
  agentSlug: _createAgent.properties.slug,
});

// Branch shared DTOs
const _selectBranch = createSelectSchema(branches);

const OMIT_BRANCH_FIELDS = [...AUDIT_FIELDS, ...ID_FIELDS, "agentId"] as const;

export const Branch = t.Omit(_selectBranch, [...OMIT_BRANCH_FIELDS]);

export const BranchList = t.Array(Branch);
