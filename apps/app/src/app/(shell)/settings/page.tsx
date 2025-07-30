import { Suspense } from "react";

import { Skeleton } from "@hebo/ui/components/Skeleton";

import { AccountSettings } from "~/components/auth/AccountSettings";
import { AuthProvider } from "~/components/auth/AuthProvider";

export default function Settings() {
  // AccountSettings may take a while to load
  return (
    <Suspense
      fallback={
        <>
          <Skeleton className="w-full h-20 m-4" />
          <Skeleton className="w-full h-20 m-4" />
          <Skeleton className="w-full h-20 m-4" />
        </>
      }
    >
      <AuthProvider>
        <AccountSettings />
      </AuthProvider>
    </Suspense>
  );
}
