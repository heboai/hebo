import { Suspense } from "react";

import { Skeleton } from "@hebo/ui/components/Skeleton";

import { AccountSettings } from "~/components/auth/AccountSettings";
import { AuthProvider } from "~/components/auth/AuthProvider";

export default function Profile() {
  return (
    // AccountSettings may take a few seconds to load
    <Suspense fallback={<Skeleton count={3} className="m-4 h-20 w-full" />}>
      <AuthProvider>
        <AccountSettings />
      </AuthProvider>
    </Suspense>
  );
}
