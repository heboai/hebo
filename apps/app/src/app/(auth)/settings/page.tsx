import { Suspense } from "react";
import { Loading } from "@/components/ui/loading";
import { UserSettings } from "./UserSettings";

export default function Settings() {
    return (
        <Suspense fallback={<Loading size="md" variant="primary" />}>
            <UserSettings />
        </Suspense>
    );
}