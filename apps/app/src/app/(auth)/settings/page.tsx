import { AccountSettings, StackTheme } from "@stackframe/react";

import { stackApp, StackProvider } from "~/lib/auth";

export default function Settings() {
    return (
        <div className="w-full min-h-screen flex flex-col items-center p-4 md:py-12">
            <div className="w-full max-h-xl max-w-3xl">
                <StackProvider app={stackApp}>
                    <StackTheme>
                        <AccountSettings />
                    </StackTheme>
                </StackProvider>
            </div>
        </div>
    );
}
