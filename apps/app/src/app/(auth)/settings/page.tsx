import { AccountSettings } from "@stackframe/react";
import { stackApp, StackProvider } from "~/lib/auth";
import { Suspense } from "react";
import { Loading } from "@hebo/ui/components/base/Loading";

export default function Settings() {
    return (
        <StackProvider app={stackApp}>

            {/* <RequireAuth /> */}
            <Suspense fallback={<Loading size="md" variant="primary" />}>
                <AccountSettings fullPage={false} />
            </Suspense>

        </StackProvider>
    );
}
