import Elysia from "elysia";

import { authenticateUserLocalhost } from "./mode/localhost";
import { authenticateUserStackAuth, projectId } from "./mode/stack-auth";

const isStackAuthEnabled = projectId.trim().length > 0;

const chosenAuth = isStackAuthEnabled
  ? authenticateUserStackAuth
  : authenticateUserLocalhost;

export const authService = new Elysia({ name: "Service.Auth" })
  .use(chosenAuth)
  .macro({
    isSignedIn(enabled: boolean) {
      if (!enabled) return {};
      return {
        beforeHandle({ userId }) {
          if (!userId) {
            throw new Response("Unauthorized", { status: 401 });
          }
        },
      };
    },
  })
  .as("global");
