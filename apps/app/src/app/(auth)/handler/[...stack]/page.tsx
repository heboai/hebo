import { AuthHandler } from "~/components/auth/AuthHandler";

// Generate static params for StackFrame handler routes
export function generateStaticParams() {
  return [
    { stack: ['sign-in'] },
    { stack: ['sign-up'] },
    { stack: ['sign-out'] },
    { stack: ['email-verification'] },
    { stack: ['password-reset'] },
    { stack: ['forgot-password'] },
    { stack: ['oauth-callback'] },
    { stack: ['magic-link-callback'] },
    { stack: ['account-settings'] },
    { stack: ['error'] },
    { stack: ['team-invitation'] },
    { stack: ['mfa'] },
  ];
}

export default function Handler() {
  return <AuthHandler />;
}
