import { Elysia } from "elysia";

import { userId } from "~/middlewares/user-id";
import { withRequestTransaction } from "~/utils/request-db";

import * as AgentsModel from "./model";
import { AgentService } from "./service";

export const agentsModule = new Elysia({
  name: "agents-module",
  prefix: "/agents",
})
  .use(userId)
  .post(
    "/",
    withRequestTransaction(async ({ body, set, userId }) => {
      const agent = await AgentService.createAgent(body, userId);
      set.status = 201;
      return agent;
    }),
    {
      body: AgentsModel.CreateBody,
      response: {
        201: AgentsModel.Agent,
        400: AgentsModel.InvalidModel,
        409: AgentsModel.AlreadyExists,
      },
    },
  )
  // TODO: include the 'expand' option
  .get(
    "/",
    async ({ set, userId }) => {
      const agentList = await AgentService.listAgents(userId);
      set.status = 200;
      return agentList;
    },
    { response: AgentsModel.AgentList },
  )
  // TODO: include the 'expand' option
  .get(
    "/:agentSlug",
    async ({ params, set, userId }) => {
      const agent = await AgentService.getAgentBySlug(params.agentSlug, userId);
      set.status = 200;
      return agent;
    },
    {
      params: AgentsModel.PathParam,
      response: { 200: AgentsModel.Agent, 404: AgentsModel.NotFound },
    },
  )
  .put(
    "/:agentSlug",
    withRequestTransaction(async ({ body, params, set, userId }) => {
      const agent = await AgentService.updateAgent(
        params.agentSlug,
        body,
        userId,
      );
      set.status = 200;
      return agent;
    }),
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
        userId,
      );
      set.status = 204;
      return agent;
    },
    { params: AgentsModel.PathParam, response: { 204: AgentsModel.NoContent } },
  );
