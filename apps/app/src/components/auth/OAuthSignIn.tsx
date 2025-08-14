"use client";

import Link from "next/link";
import { lazy } from "react";

import { Button } from "@hebo/shared-ui/components/Button";

import { isStackAuthEnabled } from "~/lib/utils";

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
      <Link href="/" aria-label="Sign in with dummy OAuth provider">
        Dummy OAuth SignIn
      </Link>
    </Button>
  );
}
