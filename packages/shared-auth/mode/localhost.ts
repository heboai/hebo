import { Elysia, status } from "elysia";
import isLocalhostIp from "is-localhost-ip";

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

const getHostname = (hostHeader: string | null) => {
  const raw = (hostHeader ?? "").trim();
  if (!raw) return "";
  try {
    return new URL(`http://${raw}`).hostname;
  } catch {
    return raw;
  }
};

export const authenticateUserLocalhost = () => {
  warnLocalhostOnce();
  return new Elysia({ name: "authenticate-user-localhost" })
    .derive(async ({ server, request }) => {
      const got = server?.requestIP(request);
      const clientIp = (
        typeof got === "string" ? got : (got?.address ?? "")
      ).trim();
      const hostHeader = request.headers.get("host");
      const hostname = getHostname(hostHeader);
      const [ipIsLocal, hostIsLocal] = await Promise.all([
        isLocalhostIp(clientIp),
        isLocalhostIp(hostname),
      ]);

      if (!(ipIsLocal && hostIsLocal)) throw status(403, "Forbidden");

      return { userId: "dummy" } as const;
    })
    .onBeforeHandle(({ userId }) => {
      if (!userId) throw status(401, "Unauthorized");
    })
    .as("global");
};
