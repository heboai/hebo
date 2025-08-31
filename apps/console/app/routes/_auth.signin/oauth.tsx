import { lazy } from "react";
import { Link } from "react-router";

import { Button } from "@hebo/ui/components/Button";

import { isStackAuthEnabled } from "~console/lib/env";

const StackOAuthSignIn = lazy(() =>
  import("@stackframe/react").then((mod) => ({
    default: mod.OAuthButtonGroup,
  })),
);

export function OAuthSignIn() {
  return isStackAuthEnabled ? (
    <StackOAuthSignIn type="sign-in" />
  ) : (
    <Button asChild variant="outline" className="w-full">
      <Link
        to="/"
        viewTransition
        aria-label="Sign in with dummy OAuth provider"
      >
        Dummy OAuth SignIn
      </Link>
    </Button>
  );
}
