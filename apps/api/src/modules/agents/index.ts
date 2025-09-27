import Elysia from "elysia";

import {
  createAgent,
  getAllAgents,
  getAgentBySlug,
  softDeleteAgent,
  updateAgent,
} from "@hebo/database/repository";
import { authService } from "@hebo/shared-api/auth/auth-service";

import { queryParams } from "~api/middlewares/query-params";

import * as AgentsModel from "./model";

export const agentsModule = new Elysia({
  name: "agents-module",
  prefix: "/agents",
})
  .use(authService)
  .use(queryParams)
  .get(
    "/",
    async ({ userId, expandBranches }) => {
      return await getAllAgents(userId!, expandBranches);
    },
    { response: { 200: AgentsModel.AgentList } },
  )
  .post(
    "/",
    async ({ body, set, userId, expandBranches }) => {
      const agent = await createAgent(
        body.name,
        body.defaultModel,
        userId!,
        expandBranches,
      );
      set.status = 201;
      return agent;
    },
    {
      body: AgentsModel.CreateBody,
      response: { 201: AgentsModel.Agent },
    },
  )
  .get(
    "/:agentSlug",
    async ({ params, userId, expandBranches }) => {
      console.log("expandBranches", expandBranches);
      // TODO: just return here
      const agent = await getAgentBySlug(
        params.agentSlug,
        userId!,
        expandBranches,
      );
      console.log("agent", agent);
      return agent;
    },
    {
      params: AgentsModel.PathParam,
      response: { 200: AgentsModel.Agent },
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, params, userId, expandBranches }) => {
      return await updateAgent(
        params.agentSlug,
        body.name,
        userId!,
        expandBranches,
      );
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
