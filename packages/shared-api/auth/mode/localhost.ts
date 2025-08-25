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

export const authenticateUserLocalhost = () => {
  warnLocalhostOnce();
  return new Elysia({ name: "authenticate-user-localhost" })
    .derive(async ({ request, server }) => {
      const got = server?.requestIP(request);
      const clientIp = (
        typeof got === "string" ? got : (got?.address ?? "")
      ).trim();
      const hostname = new URL(request.url).hostname.trim();
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
