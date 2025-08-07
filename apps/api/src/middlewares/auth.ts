import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { jwt as elysiaJwt } from "@elysiajs/jwt";
import * as jose from "jose";

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
 *   • `apiKeyOwnerId`  – when a valid API-key is provided
 *   • `userId`         – when a valid JWT is provided (payload.sub)
 */
const {
  NEXT_PUBLIC_STACK_PROJECT_ID: projectId,
  STACK_SECRET_SERVER_KEY: secretServerKey,
} = process.env as unknown as StackAuthEnv;

/* Remote JWKS for JWT validation */
const jwks = jose.createRemoteJWKSet(
  new URL(
    `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`,
  ),
);
export const authenticateUser = new Elysia({
  name: "authenticate-user",
})
  /* ──────────────────────────────────────────────────────────────── */
  /* 1) Bearer plugin                                                */
  /* ──────────────────────────────────────────────────────────────── */
  .use(bearer())

  /* ──────────────────────────────────────────────────────────────── */
  /* 2) JWT plugin                                                   */
  /* ──────────────────────────────────────────────────────────────── */
  .use(
    elysiaJwt({
      name: "jwt",
      secret: jwks as unknown as any, // Remote JWKS resolver (jose)
    }),
  )

  /* ──────────────────────────────────────────────────────────────── */
  /* 3) Accept exactly one credential                                */
  /* ──────────────────────────────────────────────────────────────── */
  .onBeforeHandle({ as: "global" }, async (ctx) => {
    const { headers, bearer: bearerToken, jwt, set, store } = ctx as any;

    const authHeader = headers["authorization"];
    const accessToken = headers["x-access-token"] as string | undefined;

    // No credential
    if (!authHeader && !accessToken) {
      set.status = 401;
      return "Unauthorized";
    }

    // Both credentials
    if (authHeader && accessToken) {
      set.status = 401;
      return "Send either Authorization or X-Access-Token header";
    }

    /* ───────── Validate JWT ───────── */
    if (accessToken) {
      try {
        const payload: any = await jwt.verify(accessToken);
        store.userId = payload?.sub;
      } catch {
        set.status = 403;
        return "Invalid or expired JWT";
      }
    }

    /* ───────── Validate API-key ───── */
    if (authHeader) {
      const token = bearerToken as string | undefined;
      if (!token) {
        set.status = 403;
        return "Invalid API key";
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
        set.status = 403;
        return "Invalid API key";
      }

      const { userId: apiKeyOwnerId } = await response.json();
      store.apiKeyOwnerId = apiKeyOwnerId;
    }
  });
