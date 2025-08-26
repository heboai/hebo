import { Elysia, status } from "elysia";

import { authServiceLocalhost } from "./localhost";
import { authServiceStackAuth, projectId } from "./stack-auth";

const isStackAuthEnabled = projectId.trim().length > 0;

const chosenAuth = isStackAuthEnabled
  ? authServiceStackAuth
  : authServiceLocalhost;

export const authService = new Elysia({ name: "Service.Auth" })
  .use(chosenAuth)
  .macro({
    isSignedIn: {
      beforeHandle({ userId }) {
        if (!userId) throw status(401, "Unauthorized");
      },
    },
  })
  .as("scoped");
