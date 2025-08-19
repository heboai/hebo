import { and, asc, eq, isNull } from "drizzle-orm";
import { status } from "elysia";

import { db } from "@hebo/db";
import type { UniversalDbClient } from "@hebo/db";
import { branches } from "@hebo/db/schema/branches";

import type { AuditFields } from "~/middlewares/audit-fields";
import { createSlug } from "~/utils/create-slug";

import * as BranchesModel from "./model";

export const BranchService = {
  async createBranch(
    agentId: string,
    input: BranchesModel.CreateBody,
    auditFields: AuditFields,
    client: UniversalDbClient = db,
  ) {
    const slug = createSlug(input.name);

    const [branch] = await client
      .insert(branches)
      .values({
        agentId,
        ...input,
        slug,
        createdBy: auditFields.createdBy,
        updatedBy: auditFields.updatedBy,
      })
      .onConflictDoNothing()
      .returning();

    if (!branch)
      throw status(
        409,
        "Branch with this name already exists" satisfies BranchesModel.AlreadyExists,
      );

    return branch;
  },

  async createInitialBranch(
    agentId: string,
    defaultModel: string,
    auditFields: AuditFields,
    client: UniversalDbClient = db,
  ) {
    const model = { alias: "default" as const, type: defaultModel };
    return this.createBranch(
      agentId,
      {
        name: "main",
        models: [model],
      } as BranchesModel.CreateBody,
      auditFields,
      client,
    );
  },

  async listBranches(agentId: string) {
    const branchList = await db
      .select()
      .from(branches)
      .where(and(eq(branches.agentId, agentId), isNull(branches.deletedAt)))
      .orderBy(asc(branches.createdAt));
    return branchList;
  },

  async getBranchBySlug(agentId: string, branchSlug: string) {
    const [branch] = await db
      .select()
      .from(branches)
      .where(
        and(
          eq(branches.slug, branchSlug),
          eq(branches.agentId, agentId),
          isNull(branches.deletedAt),
        ),
      );

    if (!branch)
      throw status(404, "Branch not found" satisfies BranchesModel.NotFound);
    return branch;
  },

  async updateBranch(
    agentId: string,
    branchSlug: string,
    input: BranchesModel.UpdateBody,
    auditFields: AuditFields,
  ) {
    const [branch] = await db
      .update(branches)
      .set({ ...input, updatedBy: auditFields.updatedBy })
      .where(
        and(
          eq(branches.slug, branchSlug),
          eq(branches.agentId, agentId),
          isNull(branches.deletedAt),
        ),
      )
      .returning();

    if (!branch)
      throw status(404, "Branch not found" satisfies BranchesModel.NotFound);
    return branch;
  },
};
