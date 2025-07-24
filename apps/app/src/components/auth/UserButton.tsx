"use client";

import { useSnapshot } from "valtio";
import { UserButton as StackUserButton, useUser } from "@stackframe/react";

import { isStackAuth } from "~/lib/auth";
import { authState } from "~/stores/auth";

export function UserButton() {
    
    isStackAuth? useUser({or: "redirect"}) : null;

    const snap = useSnapshot(authState);

    if (isStackAuth) {
        return (
            <div className="w-10 h-10">
                <StackUserButton
                    showUserInfo={false}
                    extraItems={[{
                        text: 'Documentation',
                        icon: null,
                        onClick: () => { window?.open?.('https://docs.hebo.ai', '_blank') },
                    }]}
                />
            </div>
        );

    } else {
        {/* Dummy component */}
        return (
            <div className="w-10 h-10 rounded-4xl flex justify-center items-center text-xs font-semibold bg-gray-200 ">
                {snap.user.initials}
            </div>
        );
    }
} 
