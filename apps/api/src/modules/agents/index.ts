import { Elysia } from "elysia";

import { authService } from "@hebo/shared-api/auth/auth-service";

import * as AgentsModel from "./model";
import { AgentService } from "./service";

export const agentsModule = new Elysia({
  name: "agents-module",
  prefix: "/agents",
})
  .use(authService)
  .post(
    "/",
    async ({ body, set, userId }) => {
      const agent = await AgentService.createAgent(body, userId!);
      set.status = 201;
      return agent;
    },
    {
      body: AgentsModel.CreateBody,
      response: {
        201: AgentsModel.Agent,
        400: AgentsModel.InvalidModel,
        409: AgentsModel.AlreadyExists,
      },
    },
  )
  .get(
    "/",
    async ({ set, userId }) => {
      const agentList = await AgentService.listAgents(userId!);
      set.status = 200;
      return agentList;
    },
    { response: AgentsModel.AgentList },
  )
  .get(
    "/:agentSlug",
    async ({ query, params, set, userId }) => {
      const agent = await AgentService.getAgentBySlug(
        params.agentSlug,
        userId!,
        query.expand,
      );
      set.status = 200;
      return agent;
    },
    {
      query: AgentsModel.QueryParam,
      params: AgentsModel.PathParam,
      response: {
        200: AgentsModel.AgentWithBranches,
        404: AgentsModel.NotFound,
      },
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, params, set, userId }) => {
      const agent = await AgentService.updateAgent(
        params.agentSlug,
        body,
        userId!,
      );
      set.status = 200;
      return agent;
    },
    {
      params: AgentsModel.PathParam,
      body: AgentsModel.UpdateBody,
      response: { 200: AgentsModel.Agent, 404: AgentsModel.NotFound },
    },
  )
  .delete(
    "/:agentSlug",
    async ({ params, set, userId }) => {
      const agent = await AgentService.softDeleteAgent(
        params.agentSlug,
        userId!,
      );
      set.status = 204;
      return agent;
    },
    { params: AgentsModel.PathParam, response: { 204: AgentsModel.NoContent } },
  );
