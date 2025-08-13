import { Elysia } from "elysia";

import { branchRoutes } from "./branches";
import { createAgent, selectAgent, updateAgent } from "../contracts/agents";
import { ErrorResponse } from "../contracts/common";

export const agentRoutes = new Elysia({
  name: "agent-routes",
  prefix: "/agents",
})
  .post(
    "/",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      body: createAgent,
      response: { 501: ErrorResponse },
    },
  )
  .get(
    "/",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      response: { 501: ErrorResponse },
    },
  )
  .get(
    "/:agentSlug",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      params: selectAgent,
      response: { 501: ErrorResponse },
    },
  )
  .put(
    "/:agentSlug",
    async ({ set }) => {
      set.status = 501;
      return { error: "Not implemented" } as const;
    },
    {
      params: selectAgent,
      body: updateAgent,
      response: { 501: ErrorResponse },
    },
  )
  // hierarchical relationships between agents and branches
  .use(branchRoutes);
