import { bearer } from "@elysiajs/bearer";
import { Elysia } from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";

interface StackAuthEnv {
  NEXT_PUBLIC_STACK_PROJECT_ID?: string;
  STACK_SECRET_SERVER_KEY?: string;
}

/**
 * Authentication & authorization plugin using Elysia's Bearer + JWT plugins.
 *
 * The caller MUST supply **either**:
 *   • `Authorization: Bearer <api-key>`  (Stack user API-key)
 *   • `X-Access-Token: <jwt>`           (Stack session JWT)
 *
 * Behaviour
 *   • Missing credential               → 401
 *   • Both credentials supplied        → 401
 *   • Supplied but invalid credential  → 403
 *
 * On success the plugin decorates `ctx.store` with:
 *   • `userId` – the authenticated user's ID (API-key owner or JWT subject)
 */
const {
  NEXT_PUBLIC_STACK_PROJECT_ID: projectId,
  STACK_SECRET_SERVER_KEY: secretServerKey,
} = process.env as unknown as StackAuthEnv;

if (!projectId || !secretServerKey) {
  throw new Error("STACK auth env vars missing");
}

/* Remote JWKS for JWT validation */
const jwks = createRemoteJWKSet(
  new URL(
    `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`,
  ),
);

type AuthError = { status: number; error: string };

const validateJwtToken = async (
  accessToken: string,
): Promise<string | AuthError> => {
  try {
    const { payload } = await jwtVerify(accessToken, jwks);
    const subject = payload?.sub as string | undefined;
    if (!subject) {
      return { status: 403, error: "Invalid or expired JWT" };
    }
    return subject;
  } catch {
    return { status: 403, error: "Invalid or expired JWT" };
  }
};

const validateApiKey = async (
  token: string | undefined,
): Promise<string | AuthError> => {
  if (!token) {
    return { status: 403, error: "Invalid API key" };
  }

  const response = await fetch(
    "https://api.stack-auth.com/api/v1/user-api-keys/check",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-stack-access-type": "server",
        "x-stack-project-id": projectId ?? "",
        "x-stack-secret-server-key": secretServerKey ?? "",
      },
      body: JSON.stringify({ api_key: token }),
    },
  );

  if (response.status !== 200) {
    return { status: 403, error: "Invalid API key" };
  }

  try {
    const data = (await response.json()) as Record<string, unknown>;
    const userIdFromApiKey = data?.user_id as string | undefined;
    if (!userIdFromApiKey) {
      return { status: 403, error: "Invalid API key" };
    }
    return userIdFromApiKey;
  } catch {
    return { status: 403, error: "Invalid API key response" };
  }
};

const checkCredentialChoice = (
  authHeader?: string,
  accessToken?: string,
): AuthError | undefined => {
  if (!authHeader && !accessToken) {
    return { status: 401, error: "Unauthorized" };
  }

  if (authHeader && accessToken) {
    return {
      status: 401,
      error: "Send either Authorization or X-Access-Token header",
    };
  }

  return undefined;
};

export const authenticateUser = new Elysia({
  name: "authenticate-user",
})
  .state("userId", undefined as string | undefined)
  .use(bearer())

  // Accept exactly one credential
  .onBeforeHandle(
    { as: "global" },
    async ({ headers, bearer: bearerToken, set, store }) => {
      const authHeader = headers["authorization"];
      const accessToken = headers["x-access-token"] as string | undefined;

      const choiceError = checkCredentialChoice(authHeader, accessToken);
      if (choiceError) {
        set.status = choiceError.status;
        return { error: choiceError.error } as const;
      }

      if (accessToken) {
        const jwtResult = await validateJwtToken(accessToken);
        if (typeof jwtResult !== "string") {
          set.status = jwtResult.status;
          return { error: jwtResult.error } as const;
        }
        store.userId = jwtResult;
      }

      if (authHeader) {
        const apiKeyResult = await validateApiKey(bearerToken);
        if (typeof apiKeyResult !== "string") {
          set.status = apiKeyResult.status;
          return { error: apiKeyResult.error } as const;
        }
        store.userId = apiKeyResult;
      }
    },
  )
  // Derive userId into context for type-safe access in routes
  .derive(({ store }) => ({
    userId: store.userId,
  }));
