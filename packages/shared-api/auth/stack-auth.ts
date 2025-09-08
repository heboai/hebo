import { createPinoLogger } from "@bogeychan/elysia-logger";
import { bearer } from "@elysiajs/bearer";
import { Elysia, status } from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";

const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const log = createPinoLogger({ level: LOG_LEVEL });

export const projectId = process.env.VITE_STACK_PROJECT_ID ?? "";
export const secretServerKey = process.env.STACK_SECRET_SERVER_KEY ?? "";

const jwks = createRemoteJWKSet(
  new URL(
    `https://api.stack-auth.com/api/v1/projects/${projectId}/.well-known/jwks.json`,
  ),
);

const verifyJwt = async (token: string): Promise<string | undefined> => {
  try {
    const { payload } = await jwtVerify(token, jwks);
    return payload.sub;
  } catch (error) {
    log.info(error, "JWT verification failed");
  }
};

const checkApiKey = async (key: string): Promise<string | undefined> => {
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
  if (res.status === 200) {
    const { user_id } = await res.json();
    return user_id;
  } else log.info(res, "API Key check failed");
};

export const authServiceStackAuth = new Elysia({
  name: "authenticate-user-stack-auth",
})
  .use(bearer())
  .resolve(async ({ bearer: apiKey, cookie }) => {
    const jwt =
      cookie["stack-access"]?.value &&
      JSON.parse(decodeURIComponent(cookie["stack-access"]!.value))[1];

    if (apiKey && jwt)
      throw status(
        400,
        "Provide exactly one credential: Bearer API Key or JWT Cookie",
      );

    if (apiKey) return { userId: await checkApiKey(apiKey) } as const;
    if (jwt) return { userId: await verifyJwt(jwt!) } as const;

    log.info("No credentials provided");
    return { userId: undefined } as const;
  })
  .as("scoped");
