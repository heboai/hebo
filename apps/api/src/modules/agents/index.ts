import Elysia from "elysia";

import { AgentRepo } from "@hebo/database/repository";
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
      return AgentRepo(userId!).getAll(expandBranches);
    },
    { response: { 200: AgentsModel.AgentList } },
  )
  .post(
    "/",
    async ({ body, set, userId, expandBranches }) => {
      const agent = AgentRepo(userId!).create(
        body.name,
        body.defaultModel,
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
      return AgentRepo(userId!).getBySlug(params.agentSlug, expandBranches);
    },
    {
      params: AgentsModel.PathParam,
      response: { 200: AgentsModel.Agent },
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, params, userId, expandBranches }) => {
      return AgentRepo(userId!).update(
        params.agentSlug,
        body.name,
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
      AgentRepo(userId!).softDelete(params.agentSlug);
      set.status = 204;
    },
    {
      params: AgentsModel.PathParam,
      response: { 204: AgentsModel.NoContent },
    },
  );
