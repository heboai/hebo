import { Elysia, status } from "elysia";

import * as Repository from "@hebo/database/repository";
import { authService } from "@hebo/shared-api/auth/auth-service";

import { agentSlug } from "~api/middlewares/slugs";

import * as AgentsModel from "./model";

export const agentsModule = new Elysia({
  name: "agents-module",
  prefix: "/agents",
})
  .use(authService)
  .get(
    "/",
    async ({ userId }) => {
      const agentList = await Repository.getAllAgents(userId!, true);
      return agentList;
    },
    { response: AgentsModel.AgentList },
  )
  .post(
    "/",
    async ({ body, set, userId }) => {
      const agent = await Repository.createAgent(
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
        400: AgentsModel.InvalidModel,
        409: AgentsModel.AlreadyExists,
      },
    },
  )
  .use(agentSlug)
  .get(
    "/:agentSlug",
    async ({ query, agentSlug, userId }) => {
      const agent = await Repository.getAgentBySlug(
        agentSlug,
        userId!,
        query.expand === "branches",
      );
      if (!agent) {
        throw status(404, AgentsModel.NotFound.const);
      }
      return agent;
    },
    {
      query: AgentsModel.QueryParam,
      params: AgentsModel.PathParam,
      response: {
        200: AgentsModel.Agent,
        404: AgentsModel.NotFound,
      },
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, agentSlug, userId }) => {
      const agent = await Repository.updateAgent(
        agentSlug,
        body.name!,
        userId!,
        true,
      );
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
    async ({ set, agentSlug, userId }) => {
      const agent = await Repository.softDeleteAgent(agentSlug, userId!);
      set.status = 204;
      return agent;
    },
    { params: AgentsModel.PathParam, response: { 204: AgentsModel.NoContent } },
  );
