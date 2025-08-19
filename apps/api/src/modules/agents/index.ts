import { Elysia } from "elysia";

import { auditFields } from "~/middlewares/audit-fields";

import * as AgentsModel from "./model";
import { AgentService } from "./service";

export const agentsModule = new Elysia({
  name: "agents-module",
  prefix: "/agents",
})
  .use(auditFields)
  .post(
    "/",
    async ({ body, set, auditFields }) => {
      const agent = await AgentService.createAgent(body, auditFields);
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
  // TODO: include the 'expand' option
  .get(
    "/",
    async ({ set }) => {
      const agentList = await AgentService.listAgents();
      set.status = 200;
      return agentList;
    },
    { response: AgentsModel.AgentList },
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
      response: { 200: AgentsModel.Agent, 404: AgentsModel.NotFound },
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, params, set, auditFields }) => {
      const agent = await AgentService.updateAgent(
        params.agentSlug,
        body,
        auditFields,
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
    async ({ params, set, auditFields }) => {
      const agent = await AgentService.softDeleteAgent(
        params.agentSlug,
        auditFields,
      );
      set.status = 204;
      return agent;
    },
    { params: AgentsModel.PathParam, response: { 204: AgentsModel.NoContent } },
  );
