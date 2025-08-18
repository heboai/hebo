import { lazy } from "react";
import { Link } from "react-router";

import { Button } from "@hebo/ui/components/Button";

import { isStackAuthEnabled } from "~/lib/env";

const StackMagicLinkSignIn = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.MagicLinkSignIn })),
);

export function MagicLinkSignIn() {
  return isStackAuthEnabled ? (
    <StackMagicLinkSignIn />
  ) : (
    <Button asChild variant="outline" className="w-full">
      <Link to="/" viewTransition>
        Dummy MagicLink SignIn
      </Link>
    </Button>
  );
}
