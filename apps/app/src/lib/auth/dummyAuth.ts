import { userStore } from "~/stores/userStore";

import type { AuthService } from "./types";

export const authService: AuthService = {
  ensureSignedIn() {
    userStore.user = {
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
};
