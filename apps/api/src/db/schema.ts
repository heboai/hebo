import { varchar, integer, pgTable as table } from 'drizzle-orm/pg-core';

export const agents = table(
  'agents',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar()
  }
);
