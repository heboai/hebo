import { Suspense } from "react";

import { Skeleton } from "@hebo/ui/components/Skeleton";

import { AccountSettings } from "~/components/auth/AccountSettings";
import { AuthProvider } from "~/components/auth/AuthProvider";

export default function Settings() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center p-4 md:py-12">
      <div className="w-full max-w-3xl">
        {/* AccountSettings may a while to load */}
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
      </div>
    </div>
  );
}
