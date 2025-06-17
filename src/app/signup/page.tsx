import { CredentialSignUp } from "@stackframe/stack";
import AuthLayout from "@/components/auth/AuthLayout";
import Link from "next/link";


export default function CustomSignUpPage() {
  return (
    <AuthLayout>
      <div className="space-y-4">
          <CredentialSignUp />
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