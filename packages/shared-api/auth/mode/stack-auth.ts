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

const determineAuthMode = (
  apiKey?: string | null,
  jwt?: string | null,
): "apiKey" | "jwt" => {
  const hasApiKey = !!apiKey;
  const hasJwt = !!jwt;
  if (!hasApiKey && !hasJwt) throw status(401, "Unauthorized");
  if (hasApiKey && hasJwt)
    throw status(
      401,
      "Provide exactly one credential: Authorization (Bearer API key) or stack-access cookie",
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
    .resolve(async ({ bearer: apiKey, cookie }) => {
      const raw = cookie["stack-access"]?.value;
      const jwt = raw ? JSON.parse(decodeURIComponent(raw))[1] : undefined;
      const mode = determineAuthMode(apiKey, jwt);
      const userId =
        mode === "jwt" ? await verifyJwt(jwt!) : await checkApiKey(apiKey!);
      if (!userId) throw status(401, "Unauthorized");
      return { userId } as const;
    })
    .as("scoped");
