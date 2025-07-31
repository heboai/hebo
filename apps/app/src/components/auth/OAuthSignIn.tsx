"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { Button } from "@hebo/ui/components/Button";

import { isStackAuthEnabled } from "~/lib/utils";

const StackOAuthSignIn = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.OAuthButtonGroup),
);

export function OAuthSignIn() {
  return isStackAuthEnabled ? (
    <StackOAuthSignIn type="sign-in" />
  ) : (
    <Button asChild variant="outline" className="w-full">
      <Link href="/">Dummy OAuth SignIn</Link>
    </Button>
  );
}
