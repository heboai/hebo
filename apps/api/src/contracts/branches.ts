import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { t } from "elysia";

import { branches } from "@hebo/db/schema/branches";

import { selectAgent } from "./agents";

const _selectBranch = createSelectSchema(branches);

export const createBranch = createInsertSchema(branches);
export const updateBranch = createUpdateSchema(branches);
export const selectBranch = t.Object({
  branchSlug: _selectBranch.properties.slug,
});

export const selectBranchWithAgent = t.Object({
  ...selectAgent.properties,
  ...selectBranch.properties,
});
