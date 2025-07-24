"use client";

import { UserButton as StackUserButton } from "@stackframe/react";

import { isStackAuth } from "~/lib/utils";

export function UserButton() {

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
                {/* ToDo: Read from User Store */}
                {/* ToDo: Add Sign-in Page */}
                N/A
            </div>
        );
    }
} 