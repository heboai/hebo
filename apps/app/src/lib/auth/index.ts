import { authService as stackAuthService, stackApp } from "./stackAuth";
import { authService as dummyAuthService } from "./dummyAuth";

const isStackAuthEnabled = process.env.NEXT_PUBLIC_STACK_PROJECT_ID
  ? true
  : false;

const authService = isStackAuthEnabled ? stackAuthService : dummyAuthService;

export { authService, isStackAuthEnabled, stackApp };
