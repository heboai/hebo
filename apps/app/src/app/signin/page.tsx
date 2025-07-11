import { MagicLinkSignIn, OAuthButtonGroup } from "@stackframe/stack";
import AuthLayout from "@/components/auth/AuthLayout";

export default function CustomSignInPage() {
  return (
    <AuthLayout>
      <div className="space-y-4">
          <OAuthButtonGroup type="sign-in" />
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <span className="text-sm whitespace-nowrap">or continue with</span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>
          <MagicLinkSignIn />
        <div className="w-full h-[1px] bg-gray-200 mt-4" />
      </div>
    </AuthLayout>
  );
} 