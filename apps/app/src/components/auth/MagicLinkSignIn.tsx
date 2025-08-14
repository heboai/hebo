"use client";

import Link from "next/link";
import { lazy } from "react";

import { Button } from "@hebo/shared-ui/components/Button";

import { isStackAuthEnabled } from "~/lib/utils";

const StackMagicLinkSignIn = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.MagicLinkSignIn })),
);

export function MagicLinkSignIn() {
  return isStackAuthEnabled ? (
    <StackMagicLinkSignIn />
  ) : (
    <Button asChild variant="outline" className="w-full">
      <Link href="/">Dummy MagicLink SignIn</Link>
    </Button>
  );
}
