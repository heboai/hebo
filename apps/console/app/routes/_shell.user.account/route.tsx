import { lazy, Suspense } from "react";

import { isStackAuthEnabled } from "~console/lib/env";

import { Skeleton } from "@hebo/shared-ui/components/Skeleton";

import { AuthProvider } from "~console/components/AuthProvider";

const StackAccountSettings = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.AccountSettings })),
);

export default function Account() {
  return isStackAuthEnabled ? (  
    <Suspense fallback={<Skeleton count={3} className="m-4 h-20 w-full" />}>
      <AuthProvider>
        <StackAccountSettings />
      </AuthProvider>
    </Suspense>
  ) : (
    <>
      <h1>Account Settings</h1>
      <div>Not implemented for Dummy Auth</div>
    </>
  );
}
