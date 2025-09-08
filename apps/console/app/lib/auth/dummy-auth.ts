import { authStore } from "~console/state/auth";

import type { AuthService } from "./types";

export const authService = {
  async ensureSignedIn() {
    if (authStore.user) return;
    authStore.user = {
      name: "Dummy User",
      email: "dummy@user.com",
      initials: "DU",
      avatar: "",
    };
  },

  async generateApiKey() {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    throw new Error("API Keys not implemented in Dummy Auth mode");
  },

  async getAccessToken() {
    return "dummy-access-token";
  },
} satisfies AuthService;
