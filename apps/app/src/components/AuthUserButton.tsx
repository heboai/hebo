"use client";

import { UserButton } from "@stackframe/react";

interface AuthUserButtonProps {
    className?: string;
}

export function AuthUserButton({ className }: AuthUserButtonProps) {
    const handleOpenDocs = () => {
        if (typeof window !== "undefined") {
            window.open('https://docs.hebo.ai', '_blank');
        }
    };

    return (
        <div className={`w-10 h-10 ${className || ''}`}>
            <UserButton
                showUserInfo={false}
                extraItems={[{
                    text: 'Documentation',
                    icon: null,
                    onClick: handleOpenDocs
                }]}
            />
        </div>
    );
} 