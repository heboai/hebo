import { AccountSettings } from "~/components/auth/AccountSettings";
import { AuthProvider } from "~/components/auth/AuthProvider";

export default function Settings() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center p-4 md:py-12">
      <div className="w-full max-w-3xl">
        <AuthProvider>
          <AccountSettings />
        </AuthProvider>
      </div>
    </div>
  );
}
