import { authenticateUserLocalhost } from "./mode/localhost";
import { authenticateUserStackAuth, projectId } from "./mode/stack-auth";

export const isStackAuthEnabled = projectId.trim().length > 0;

export const authenticateUser = () =>
  isStackAuthEnabled
    ? authenticateUserStackAuth()
    : authenticateUserLocalhost();
