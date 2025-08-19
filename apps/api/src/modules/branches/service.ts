import { and, asc, eq, isNull } from "drizzle-orm";
import { status } from "elysia";

import type { UniversalDbClient } from "@hebo/db";
import { branches } from "@hebo/db/schema/branches";

import type { AuditFields } from "~/middlewares/audit-fields";
import { createSlug } from "~/utils/create-slug";

import * as BranchesModel from "./model";

// TODO: reduce audit fields boilerplate by using helpers from the db package. example here: https://gist.github.com/heiwen/edda78c2b3f5c544cb71ade03ecc1110
export const BranchService = {
  async createBranch(
    client: UniversalDbClient,
    agentId: string,
    input: BranchesModel.CreateBody,
    auditFields: AuditFields,
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

    if (!branch) throw status(409, BranchesModel.AlreadyExists.const);

    return branch;
  },

  async createInitialBranch(
    client: UniversalDbClient,
    agentId: string,
    defaultModel: string,
    auditFields: AuditFields,
  ) {
    const model = { alias: "default" as const, type: defaultModel };
    return this.createBranch(
      client,
      agentId,
      {
        name: "main",
        models: [model],
      } as BranchesModel.CreateBody,
      auditFields,
    );
  },

  async listBranches(client: UniversalDbClient, agentId: string) {
    const branchList = await client
      .select()
      .from(branches)
      .where(and(eq(branches.agentId, agentId), isNull(branches.deletedAt)))
      .orderBy(asc(branches.createdAt));
    return branchList;
  },

  async getBranchBySlug(
    client: UniversalDbClient,
    agentId: string,
    branchSlug: string,
  ) {
    const [branch] = await client
      .select()
      .from(branches)
      .where(
        and(
          eq(branches.slug, branchSlug),
          eq(branches.agentId, agentId),
          isNull(branches.deletedAt),
        ),
      );

    if (!branch) throw status(404, BranchesModel.NotFound.const);
    return branch;
  },

  async updateBranch(
    client: UniversalDbClient,
    agentId: string,
    branchSlug: string,
    input: BranchesModel.UpdateBody,
    auditFields: AuditFields,
  ) {
    const [branch] = await client
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

    if (!branch) throw status(404, BranchesModel.NotFound.const);
    return branch;
  },
};
