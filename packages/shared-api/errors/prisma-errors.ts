import { Elysia, status } from "elysia";

export const prismaErrors = new Elysia({
  name: "errors",
}).onError({ as: "scoped" }, ({ error }) => {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2002") {
      return status(409, "Resource already exists");
    }
    if (error.code === "P2025") {
      return status(404, "Resource not found");
    }
  }
});
