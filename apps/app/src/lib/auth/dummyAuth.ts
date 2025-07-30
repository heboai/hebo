import type { AuthService } from "./types";

export const authService: AuthService = {
  async ensureSignedIn() {
    // NoOp
  },

  async generateApiKey() {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const key = Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
    )
      .map(
        (x) =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[
            x % 62
          ],
      )
      .join("");

    return "DUMMY-" + key;
  }
};
