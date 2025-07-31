import type { AuthService } from "./types";
import { isStackAuthEnabled } from "~/lib/utils";

// FUTURE: use dynamic imports to enable tree shaking
import * as stack from "./stackAuth";
import * as dummy from "./dummyAuth";

let authService: AuthService;

if (isStackAuthEnabled) {
  authService = stack.authService;
} else {
  console.warn(" ⚠️ No auth configured, using dummy")
  authService = dummy.authService;
}

export { authService };
