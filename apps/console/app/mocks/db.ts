import { Collection } from "@msw/data";
import z from "zod";

const agentSchema = z.object({
  // Core fields
  slug: z.string(),
  name: z.string(),

  // Relations
  get branches() {
    return z.array(branchSchema);
  },

  // Audit fields
  created_by: z.string().default("Dummy User"),
  created_at: z.date().default(() => new Date()),
  updated_by: z.string().default("Dummy User"),
  updated_at: z.date().default(() => new Date()),
});

const branchSchema = z.object({
  // Core fields
  slug: z.string(),
  name: z.string(),
  models: z.array(z.unknown()),

  // Relations
  agent_slug: z.string(),

  // Audit fields
  created_by: z.string().default("Dummy User"),
  created_at: z.date().default(() => new Date()),
  updated_by: z.string().default("Dummy User"),
  updated_at: z.date().default(() => new Date()),
});

export const createDb = () => {
  const agents = new Collection({ schema: agentSchema });
  const branches = new Collection({ schema: branchSchema });

  agents.defineRelations(({ many }) => ({
    branches: many(branches, { onDelete: "cascade" }),
  }));

  return {
    agents,
    branches,
  } as const;
};

type DB = ReturnType<typeof createDb>;

declare global {
  var __heboDb: DB | undefined;
}

export const db: DB = (globalThis.__heboDb ??= createDb());
