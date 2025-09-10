import { StackClientApp } from "@stackframe/react";
import { useNavigate } from "react-router";

import { getCookie } from "~console/lib/utils";
import { authStore } from "~console/state/auth";

import type { AuthService } from "./types";

let _stackApp: StackClientApp<true, string> | undefined;

const getStackApp = (): StackClientApp<true, string> => {
  if (!_stackApp) {
    _stackApp = new StackClientApp({
      projectId: import.meta.env.VITE_STACK_PROJECT_ID!,
      publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY!,
      tokenStore: "cookie",
      urls: {
        signIn: "/signin",
        signUp: "/signin",
        home: "/",
      },
      redirectMethod: {
        useNavigate,
      },
    });
  }

  return _stackApp;
};

const authService = {
  async ensureSignedIn() {
    const user = await getStackApp().getUser({ or: "redirect" });

    if (!user) return;
    authStore.user = {
      email: user.primaryEmail ?? "",
      name: user.displayName ?? "",
      avatar: user.profileImageUrl ?? "",
    };
  },

  async generateApiKey() {
    const user = await getStackApp().getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const apiKey = await user.createApiKey({
      description: "On-boarding API key",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isPublic: false,
    });
    return apiKey.value;
  },

  getAccessToken() {
    const rawCookie = getCookie("stack-access");
    if (!rawCookie) return;
    try {
      const parsed = JSON.parse(decodeURIComponent(rawCookie));
      const accessToken: unknown = Array.isArray(parsed)
        ? parsed[1]
        : undefined;
      return typeof accessToken === "string" ? accessToken : undefined;
    } catch {
      return;
    }
  },
} satisfies AuthService;

export { authService, getStackApp };
