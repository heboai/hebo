import { authService } from "~console/lib/auth";

export const fetchConfig = {
  headers: (_path: string, options?: RequestInit) => {
    const token = authService.getAccessToken();
    if (!token) return;
    const headers = new Headers(options?.headers ?? {});
    headers.set("x-stack-access-token", token);
    return headers;
  },
};

export type FetchConfig = typeof fetchConfig;
