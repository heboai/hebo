import Elysia from "elysia";

export const queryParams = new Elysia({
  name: "query-params",
})
  .resolve(async ({ query }) => {
    return {
      expandBranches: query.expand === "branches",
    };
  })
  .as("scoped");
