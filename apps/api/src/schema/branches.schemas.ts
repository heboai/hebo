import { createSchemaFactory } from "drizzle-typebox";
import { t } from "elysia";

import { branches } from "@hebo/db/schema/branches";
import { ModelsSchema } from "@hebo/db/schema/types/models";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ typeboxInstance: t });

export const BranchInsert = createInsertSchema(branches, {
  models: ModelsSchema,
});

export const BranchSelect = createSelectSchema(branches, {
  models: ModelsSchema,
});

export const BranchUpdate = createUpdateSchema(branches, {
  models: ModelsSchema,
});
