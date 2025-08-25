import { Elysia, status } from "elysia";
import isLocalhost from "is-localhost-ip";

declare global {
  var __HEBO_WARNED_LOCALHOST: boolean | undefined;
}

const warnLocalhostOnce = () => {
  if (globalThis.__HEBO_WARNED_LOCALHOST) return;
  console.warn(
    '⚠️ [auth] Localhost mode: userId="dummy"; non-local requests will be 403',
  );
  globalThis.__HEBO_WARNED_LOCALHOST = true;
};

const getRequestHostname = () =>
  new Elysia({ name: "get-request-hostname" })
    .derive(({ request }) => {
      const hostHeader = request.headers.get("host");
      const raw = (hostHeader ?? "").trim();
      if (!raw) return { hostname: "" } as const;
      try {
        const hostname = new URL(`http://${raw}`).hostname;
        return { hostname } as const;
      } catch {
        return { hostname: raw } as const;
      }
    })
    .as("scoped");

const getClientIp = () =>
  new Elysia({ name: "get-client-ip" })
    .derive(({ server, request }) => {
      const got = server?.requestIP(request);
      return {
        clientIp: (typeof got === "string" ? got : (got?.address ?? "")).trim(),
      } as const;
    })
    .as("scoped");

export const authenticateUserLocalhost = () => {
  warnLocalhostOnce();
  return new Elysia({ name: "authenticate-user-localhost" })
    .use(getRequestHostname())
    .use(getClientIp())
    .derive(async ({ hostname, clientIp }) => {
      const [ipIsLocal, hostIsLocal] = await Promise.all([
        isLocalhost(clientIp),
        isLocalhost(hostname),
      ]);

      if (!(ipIsLocal && hostIsLocal)) throw status(403, "Forbidden");

      return { userId: "dummy" } as const;
    })
    .onBeforeHandle(({ userId }) => {
      if (!userId) throw status(401, "Unauthorized");
    })
    .as("global");
};
