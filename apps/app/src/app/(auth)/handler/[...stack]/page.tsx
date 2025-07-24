import { AuthHandler } from "~/components/auth/AuthHandler";

// Generate static params for StackFrame handler routes
export function generateStaticParams() {
  return [
    { stack: ['oauth-callback'] },
    { stack: ['magic-link-callback'] },
  ];
}

export default function Handler() {
  return <AuthHandler />;
}
