import { isStackAuthEnabled } from "./env";
import { authenticateUserLocalhost } from "./mode/localhost";
import { authenticateUserStackAuth } from "./mode/stack-auth";

export const authenticateUser = () =>
  isStackAuthEnabled
    ? authenticateUserStackAuth()
    : authenticateUserLocalhost();
