import { CredentialSignUp, OAuthButtonGroup } from "@stackframe/stack";
import AuthLayout from "@/components/auth/AuthLayout";
import Link from "next/link";

export default function CustomSignUpPage() {
  return (
    <AuthLayout>
      <div className="space-y-4">
        <CredentialSignUp />
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <span className="text-sm whitespace-nowrap">or continue with</span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>
        <OAuthButtonGroup type="sign-up" />
        <div className="w-full h-[1px] bg-gray-200 mt-4" />
        <p className="text-base text-left">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-bold underline hover:opacity-80 transition-opacity"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
} 