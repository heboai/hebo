import { Elysia } from "elysia";

import { db } from "@hebo/db";

import { auditFields } from "~/middlewares/audit-fields";

import * as AgentsModel from "./model";
import { AgentService } from "./service";

export const agentsModule = new Elysia({
  name: "agents-module",
  prefix: "/agents",
})
  .use(auditFields)
  .decorate("db", db)
  .post(
    "/",
    async ({ body, set, auditFields, db }) => {
      const agent = await AgentService.createAgent(db, body, auditFields);
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
    async ({ set, db }) => {
      const agentList = await AgentService.listAgents(db);
      set.status = 200;
      return agentList;
    },
    { response: AgentsModel.AgentList },
  )
  // TODO: include the 'expand' option
  .get(
    "/:agentSlug",
    async ({ params, set, db }) => {
      const agent = await AgentService.getAgentBySlug(db, params.agentSlug);
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
    async ({ body, params, set, auditFields, db }) => {
      const agent = await AgentService.updateAgent(
        db,
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
    async ({ params, set, auditFields, db }) => {
      const agent = await AgentService.softDeleteAgent(
        db,
        params.agentSlug,
        auditFields,
      );
      set.status = 204;
      return agent;
    },
    { params: AgentsModel.PathParam, response: { 204: AgentsModel.NoContent } },
  );
