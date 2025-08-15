import { isStackAuthEnabled } from "~/lib/env";

// FUTURE: use dynamic imports to enable tree shaking
import * as dummy from "./dummyAuth";
import * as stack from "./stackAuth";

import type { AuthService } from "./types";

let authService: AuthService;

if (isStackAuthEnabled) {
  authService = stack.authService;
} else {
  console.warn(" ⚠️ No auth configured, using dummy");
  authService = dummy.authService;
}

export { authService };
