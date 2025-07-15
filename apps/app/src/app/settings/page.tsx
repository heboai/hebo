import { Suspense } from "react";
import { Loading } from "@/components/ui/loading";
import { UserSettings } from "../../components/auth/UserSettings";

export default function SettingsPage() {
    return (
        <Suspense fallback={<Loading size="md" variant="primary" />}>
            <UserSettings />
        </Suspense>
    );
}