import { Elysia, status } from "elysia";
import { ip as elysiaIp } from "elysia-ip";
import * as ipaddr from "ipaddr.js";

const isLocalClientIp = (ip: string) => {
  const candidate = ip.trim();
  if (!candidate) return false;
  try {
    const addr = ipaddr.process(candidate) as ipaddr.IPv4 | ipaddr.IPv6;
    return addr.range() === "loopback";
  } catch {
    return false;
  }
};

export const authenticateUserLocalhost = () => {
  console.warn(
    '⚠️ [auth] Localhost mode: userId="dummy"; non-local requests will be 403',
  );
  return new Elysia({ name: "authenticate-user-localhost" })
    .use(elysiaIp({ checkHeaders: [], headersOnly: false }))
    .derive(({ ip }) => {
      const clientIp = (ip ?? "").trim();
      if (!isLocalClientIp(clientIp)) throw status(403, "Forbidden");
      return { userId: "dummy" } as const;
    })
    .onBeforeHandle(({ userId }) => {
      if (!userId) throw status(401, "Unauthorized");
    })
    .as("global");
};
