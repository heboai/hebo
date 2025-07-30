import { StackProvider } from "@stackframe/react";
import { UserButton } from "@stackframe/react";
import { stackApp } from "~/lib/auth";

export function Footer() {
  return (
    <StackProvider app={stackApp}>
      <UserButton />
    </StackProvider>
  );
}