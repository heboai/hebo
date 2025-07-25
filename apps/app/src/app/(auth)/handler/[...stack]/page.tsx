import { AuthHandler } from "~/components/auth/AuthHandler";

// Generate static params for StackAuth handler routes
export function generateStaticParams() {
  return [
    { stack: ["oauth-callback"] },
    { stack: ["magic-link-callback"] },
    { stack: ["sign-out"] },
  ];
}

export default function Handler() {
  return <AuthHandler />;
}
