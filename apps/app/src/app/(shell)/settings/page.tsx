import { Suspense } from "react";

import { Skeleton } from "@hebo/ui/components/Skeleton";

import { AccountSettings } from "~/components/auth/AccountSettings";
import { AuthProvider } from "~/components/auth/AuthProvider";

export default function Settings() {
  return (
    // AccountSettings may take a few seconds to load
    <Suspense fallback={<Skeleton count={3} className="w-full h-20 m-4" />}>
      <AuthProvider>
        <AccountSettings />
      </AuthProvider>
    </Suspense>
  );
}
