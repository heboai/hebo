import { HandlerClient } from "./HandlerClient";

// Generate static params for StackFrame handler routes
export function generateStaticParams() {
  return [
    { stack: ['oauth-callback'] },
    { stack: ['signin'] },
    { stack: ['signup'] },
    { stack: ['signout'] },
    { stack: ['verify-email'] },
    { stack: ['reset-password'] },
    { stack: ['magic-link'] },
    { stack: ['sso'] },
    { stack: ['webhook'] },
    { stack: ['settings'] },
  ];
}

export default function Handler() {
  return <HandlerClient />;
}