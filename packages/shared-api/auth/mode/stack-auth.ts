import { bearer } from "@elysiajs/bearer";
import { Elysia, status } from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";

export const projectId = process.env.VITE_STACK_PROJECT_ID ?? "";
export const secretServerKey = process.env.STACK_SECRET_SERVER_KEY ?? "";

const jwks = createRemoteJWKSet(
  new URL(
    `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`,
  ),
);

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
    const userId = (data as any)?.user_id as string | undefined;
    if (!userId) throw new Error("missing user_id");
    return userId;
  } catch {
    throw status(403, "Invalid API key response");
  }
};

export const authenticateUserStackAuth = () =>
  new Elysia({ name: "authenticate-user-stack-auth" })
    .use(bearer())
    .resolve(async ({ request, bearer }) => {
      const accessToken = request.headers.get("x-access-token") ?? undefined;
      const mode = pickOneAuthMethod(bearer, accessToken);
      const userId =
        mode === "jwt"
          ? await verifyJwt(accessToken!)
          : await checkApiKey(bearer!);
      if (!userId) throw status(401, "Unauthorized");
      return { userId } as const;
    })
    .as("scoped");
