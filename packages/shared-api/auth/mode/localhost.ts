import { Elysia } from "elysia";
import isLocalhost from "is-localhost-ip";

export const authenticateUserLocalhost = new Elysia({
  name: "authenticate-user-localhost",
})
  .onStart(async () => {
    console.warn(
      '⚠️ [auth] Localhost mode: userId="dummy"; non-local requests will be 401',
    );
  })
  .resolve(async ({ request, server }) => {
    const clientIp = ((ip) =>
      typeof ip === "string" ? ip : (ip?.address ?? ""))(
      server?.requestIP(request),
    );

    const hostname = new URL(request.url).hostname;

    const [ipIsLocal, hostIsLocal] = await Promise.all([
      isLocalhost(clientIp),
      isLocalhost(hostname),
    ]);

    return { userId: ipIsLocal && hostIsLocal ? "dummy" : undefined } as const;
  })
  .as("global");
