import { Elysia } from "elysia";

import {
  createAgent,
  getAllAgents,
  getAgentBySlug,
  softDeleteAgent,
  updateAgent,
} from "@hebo/database/repository";
import { authService } from "@hebo/shared-api/auth/auth-service";

import * as AgentsModel from "./model";

export const agentsModule = new Elysia({
  name: "agents-module",
  prefix: "/agents",
})
  .use(authService)
  .get(
    "/",
    async ({ userId }) => {
      const agentList = await getAllAgents(userId!, true);
      return agentList;
    },
    { response: AgentsModel.AgentList },
  )
  .post(
    "/",
    async ({ body, set, userId }) => {
      const agent = await createAgent(
        body.name,
        body.defaultModel,
        userId!,
        true,
      );
      set.status = 201;
      return agent;
    },
    {
      body: AgentsModel.CreateBody,
      response: {
        201: AgentsModel.Agent,
      },
    },
  )
  .get(
    "/:agentSlug",
    async ({ /*query,*/ params, userId }) => {
      const agent = await getAgentBySlug(
        params.agentSlug,
        userId!,
        // TODO: fix this
        true,
      );
      return agent;
    },
    {
      query: AgentsModel.QueryParam,
      params: AgentsModel.PathParam,
      response: {
        200: AgentsModel.Agent,
      },
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, params, userId }) => {
      const agent = await updateAgent(
        params.agentSlug,
        body.name,
        userId!,
        true,
      );
      return agent;
    },
    {
      params: AgentsModel.PathParam,
      body: AgentsModel.UpdateBody,
      response: { 200: AgentsModel.Agent },
    },
  )
  .delete(
    "/:agentSlug",
    async ({ params, set, userId }) => {
      await softDeleteAgent(params.agentSlug, userId!);
      set.status = 204;
    },
    {
      params: AgentsModel.PathParam,
      response: { 204: AgentsModel.NoContent },
    },
  );
