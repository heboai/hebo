import { Elysia, status } from "elysia";

import { projectId } from "./stack-auth";

const createAuthService = async () => {
  if (projectId.trim().length > 0) {
    const { authServiceStackAuth } = await import("./stack-auth");
    return authServiceStackAuth;
  } else {
    const { authServiceLocalhost } = await import("./localhost");
    return authServiceLocalhost;
  }
};

export const authService = new Elysia({ name: "auth-service" })
  .use(await createAuthService())
  .macro({
    isSignedIn: {
      beforeHandle({ userId }) {
        if (!userId) throw status(401, "Unauthorized");
      },
    },
  })
  .as("scoped");
