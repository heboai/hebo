import { bearer } from "@elysiajs/bearer";
import { Elysia, status } from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";

const projectId = process.env.VITE_STACK_PROJECT_ID!;
const secretServerKey = process.env.STACK_SECRET_SERVER_KEY!;
if (!projectId || !secretServerKey)
  throw new Error("STACK auth env vars missing");

const jwks = createRemoteJWKSet(
  new URL(
    `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`,
  ),
);

const accessToken = () =>
  new Elysia({ name: "access-token" })
    .derive(({ request }) => ({
      jwt: request.headers.get("x-access-token") ?? undefined,
    }))
    .as("scoped");

const pickOneAuthMethod = (apiKey?: string | null, jwt?: string | null) => {
  const hasApiKey = !!apiKey;
  const hasJwt = !!jwt;
  if (!hasApiKey && !hasJwt) throw status(401, "Unauthorized");
  if (hasApiKey && hasJwt)
    throw status(
      401,
      "Provide exactly one credential: Authorization or X-Access-Token",
    );
  return hasApiKey ? "apiKey" : "jwt";
};

const verifyJwt = async (token: string): Promise<string> => {
  try {
    const { payload } = await jwtVerify(token, jwks);
    if (!payload.sub) throw status(403, "Invalid or expired JWT");
    return String(payload.sub);
  } catch {
    throw status(403, "Invalid or expired JWT");
  }
};

const checkApiKey = async (key: string): Promise<string> => {
  const res = await fetch(
    "https://api.stack-auth.com/api/v1/user-api-keys/check",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-stack-access-type": "server",
        "x-stack-project-id": projectId,
        "x-stack-secret-server-key": secretServerKey,
      },
      body: JSON.stringify({ api_key: key }),
    },
  );
  if (res.status !== 200) throw status(403, "Invalid API key");
  try {
    const data = await res.json();
    const userId = data?.user_id as string | undefined;
    if (!userId) throw new Error("missing user_id");
    return userId;
  } catch {
    throw status(403, "Invalid API key response");
  }
};

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
 * On success the plugin derives and exposes on `ctx`:
 *   • `userId` – the authenticated user's ID (API-key owner or JWT subject)
 */
export const authenticateUser = () =>
  new Elysia({ name: "authenticate-user" })
    .use(bearer())
    .use(accessToken())
    .derive(async ({ bearer: apiKey, jwt: jwtToken }) => {
      const mode = pickOneAuthMethod(apiKey, jwtToken);
      const userId =
        mode === "jwt"
          ? await verifyJwt(jwtToken!)
          : await checkApiKey(apiKey!);
      return { userId } as const;
    })
    .as("scoped");
