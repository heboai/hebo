import { Elysia, status } from "elysia";
import * as ipaddr from "ipaddr.js";

const isLocalhostIp = (raw: string) => {
  const s = raw.trim();
  if (!s) return false;
  try {
    const addr = ipaddr.process(s) as ipaddr.IPv4 | ipaddr.IPv6;

    if (addr.range() === "loopback") return true;

    if (
      addr.kind() === "ipv6" &&
      (addr as ipaddr.IPv6).isIPv4MappedAddress?.()
    ) {
      const v4 = (addr as ipaddr.IPv6).toIPv4Address();
      if (v4.range() === "loopback") return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const authenticateUserLocalhost = () => {
  console.warn(
    '⚠️ [auth] Localhost mode: userId="dummy"; non-local requests will be 403',
  );

  return new Elysia({ name: "authenticate-user-localhost" })
    .derive(({ server, request }) => {
      const got = server?.requestIP(request);
      const clientIp = typeof got === "string" ? got : (got?.address ?? "");

      if (!isLocalhostIp(clientIp)) throw status(403, "Forbidden");
      return { userId: "dummy" } as const;
    })
    .onBeforeHandle(({ userId }) => {
      if (!userId) throw status(401, "Unauthorized");
    })
    .as("global");
};
