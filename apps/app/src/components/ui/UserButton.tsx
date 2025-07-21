"use client";

import { UserButton as StackUserButton } from "@stackframe/react";

interface UserButtonProps {
    className?: string;
}

export function UserButton({ className }: UserButtonProps) {
    const handleOpenDocs = () => {
        if (typeof window !== "undefined") {
            window.open('https://docs.hebo.ai', '_blank');
        }
    };

    return (
        <div className={`w-10 h-10 ${className || ''}`}>
            <StackUserButton
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