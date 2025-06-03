'use client';

import UserButtonWrapper from "./UserButtonWrapper";
import { ApiKeyDisplay } from "./ApiKeyDisplay";

export function Footer() {
    return (
        <div className="flex flex-col items-left gap-2">
            <UserButtonWrapper />
            <ApiKeyDisplay />
        </div>
    );
} 