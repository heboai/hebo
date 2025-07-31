"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { Button } from "@hebo/ui/components/Button";

import { isStackAuthEnabled } from "~/lib/utils";

const StackMagicLinkSignIn = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.MagicLinkSignIn),
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
