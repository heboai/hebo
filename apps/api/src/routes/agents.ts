import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { Elysia, t } from "elysia";

import { agents } from "@hebo/db/schema/agents";

import { createModelSchemas } from "../utils";

const _selectAgent = createSelectSchema(agents);
const _insertAgent = createInsertSchema(agents);
const _updateAgent = createUpdateSchema(agents);
const { createSchema: createAgent, updateSchema: updateAgent } =
  createModelSchemas({ insert: _insertAgent, update: _updateAgent });

export const selectAgent = t.Object({
  agentSlug: _selectAgent.properties.slug,
});

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
})
  .post(
    "/",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      body: createAgent,
      response: { 501: t.String() },
    },
  )
  .get(
    "/",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      response: { 501: t.String() },
    },
  )
  .get(
    "/:agentSlug",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      params: selectAgent,
      response: { 501: t.String() },
    },
  )
  .put(
    "/:agentSlug",
    async ({ set }) => {
      set.status = 501;
      return "Not implemented" as const;
    },
    {
      params: selectAgent,
      body: updateAgent,
      response: { 501: t.String() },
    },
  );
