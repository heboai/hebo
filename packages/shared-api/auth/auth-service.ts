import { Elysia, status } from "elysia";

import { projectId } from "./stack-auth";

const createAuthService = async () => {
  if (projectId === "__UNSET__") {
    const { authServiceLocalhost } = await import("./localhost");
    return authServiceLocalhost;
  } else {
    const { authServiceStackAuth } = await import("./stack-auth");
    return authServiceStackAuth;
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
