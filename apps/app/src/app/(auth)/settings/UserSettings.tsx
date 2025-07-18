"use client"

import { AccountSettings } from '@stackframe/react';
import { Suspense } from "react";
import { Loading } from "@hebo/ui";

export function UserSettings() {
    return (
        <Suspense fallback={<Loading size="md" variant="primary" />}>
            <AccountSettings fullPage={false} />
        </Suspense>
    )
} 