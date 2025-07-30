import type { AuthService } from "./types";

export const authService: AuthService = {
  async ensureSignedIn() {
    // NoOp
  },

  async generateApiKey() {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    throw new Error("API Keys not implemented in Dummy Auth mode");
  },
};
