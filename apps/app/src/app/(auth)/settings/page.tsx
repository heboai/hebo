import { AccountSettings, StackTheme } from "@stackframe/react";
import { stackApp, StackProvider } from "~/lib/auth";

export default function Settings() {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center">
            <div className="max-h-xl max-w-3xl w-full">
                <StackProvider app={stackApp}>
                    <StackTheme>
                        <AccountSettings />
                    </StackTheme>
                </StackProvider>
            </div>
        </div>
    );
}
