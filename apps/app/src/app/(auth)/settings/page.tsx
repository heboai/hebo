import { UserSettings } from "./UserSettings";
import { RequireAuth, StackProvider, stackApp } from "@/components";

export default function Settings() {
    return (
        <StackProvider app={stackApp}>
            {/* <RequireAuth /> */}
            <UserSettings />
        </StackProvider>
    );
}