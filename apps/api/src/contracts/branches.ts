import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { t } from "elysia";

import { branches } from "@hebo/db/schema/branches";

import { selectAgent } from "./agents";

const _selectBranch = createSelectSchema(branches);
const _createBranch = createInsertSchema(branches);
const _updateBranch = createUpdateSchema(branches);

export const createBranch = t.Pick(_createBranch, ["name", "models"]);
export const updateBranch = t.Pick(_updateBranch, ["name", "models"]);

export const selectBranch = t.Object({
  branchSlug: _selectBranch.properties.slug,
});

export const selectBranchWithAgent = t.Object({
  ...selectAgent.properties,
  ...selectBranch.properties,
});
