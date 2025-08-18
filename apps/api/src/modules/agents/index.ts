import { Elysia } from "elysia";

import * as AgentsModel from "./model";
import { AgentService } from "./service";

export const agentsModule = new Elysia({
  name: "agents-module",
  prefix: "/agents",
})
  .post(
    "/",
    async ({ body, set }) => {
      const agent = await AgentService.createAgent(body);
      set.status = 201;
      return agent;
    },
    {
      body: AgentsModel.CreateBody,
      response: {
        201: AgentsModel.Item,
        400: AgentsModel.InvalidModel,
        409: AgentsModel.AlreadyExists,
      },
    },
  )
  // TODO: include the 'expand' option
  .get(
    "/",
    async ({ set }) => {
      const agentList = await AgentService.listAgents();
      set.status = 200;
      return agentList;
    },
    { response: AgentsModel.ItemList },
  )
  // TODO: include the 'expand' option
  .get(
    "/:agentSlug",
    async ({ params, set }) => {
      const agent = await AgentService.getAgentBySlug(params.agentSlug);
      set.status = 200;
      return agent;
    },
    {
      params: AgentsModel.PathParam,
      response: { 200: AgentsModel.Item, 404: AgentsModel.NotFound },
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, params, set }) => {
      const agent = await AgentService.updateAgent(params.agentSlug, body);
      set.status = 200;
      return agent;
    },
    {
      params: AgentsModel.PathParam,
      body: AgentsModel.UpdateBody,
      response: { 200: AgentsModel.Item, 404: AgentsModel.NotFound },
    },
  )
  .delete(
    "/:agentSlug",
    async ({ params, set }) => {
      const agent = await AgentService.softDeleteAgent(params.agentSlug);
      set.status = 204;
      return agent;
    },
    { params: AgentsModel.PathParam, response: { 204: AgentsModel.NoContent } },
  );
