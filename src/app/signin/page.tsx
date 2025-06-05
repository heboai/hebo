import { CredentialSignIn, OAuthButtonGroup } from "@stackframe/stack";
import AuthLayout from "@/components/auth/AuthLayout";
import Link from "next/link";
import { Suspense } from "react";
import { AuthLoading } from "@/components/auth/AuthLoading";

export default function CustomSignInPage() {
  return (
    <AuthLayout>
      <div className="space-y-4">
        <Suspense fallback={<AuthLoading />}>
          <CredentialSignIn />
        </Suspense>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <span className="text-sm whitespace-nowrap">or continue with</span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>
        <Suspense fallback={<AuthLoading />}>
          <OAuthButtonGroup type="sign-in" />
        </Suspense>
        <div className="w-full h-[1px] bg-gray-200 mt-4" />
        <p className="text-base text-left">
          New to Hebo?{" "}
          <Link 
            href="/signup" 
            className="font-bold underline hover:opacity-80 transition-opacity"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
} 