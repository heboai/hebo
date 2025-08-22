import { Elysia, status } from "elysia";

const getHostAndClientIp = (request: Request) => {
  const hostHeader =
    request.headers.get("host") ??
    request.headers.get("x-forwarded-host") ??
    "";

  const realIp = request.headers.get("x-real-ip")?.trim() ?? "";
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const forwardedForFirst = forwardedFor.split(",")[0]?.trim() ?? "";
  const clientIp = realIp || forwardedForFirst || "";

  return { host: hostHeader.trim(), clientIp } as const;
};

const isLocalHost = (host: string) =>
  /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host);

const isLocalClientIp = (ip: string) => ip === "127.0.0.1" || ip === "::1";

export const authenticateUserLocalhost = () => {
  console.warn(
    '⚠️ [auth] Localhost mode: userId="dummy"; non-local requests will be 403',
  );
  return new Elysia({ name: "authenticate-user-localhost" })
    .derive(({ request }) => {
      const { host, clientIp } = getHostAndClientIp(request);
      if (!isLocalHost(host) && !isLocalClientIp(clientIp))
        throw status(403, "Forbidden");
      return { userId: "dummy" } as const;
    })
    .onBeforeHandle(({ userId }) => {
      if (!userId) throw status(401, "Unauthorized");
    })
    .as("scoped");
};
