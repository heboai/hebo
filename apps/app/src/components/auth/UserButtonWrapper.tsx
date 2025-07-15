"use client";

import { UserButton } from "@stackframe/stack";

interface UserButtonWrapperProps {
    className?: string;
}

export default function UserButtonWrapper({ className }: UserButtonWrapperProps) {
    return (
        <div className={`w-10 h-10 ${className || ''}`}>
            <UserButton
                showUserInfo={false}
                extraItems={[{
                    text: 'Documentation',
                    icon: null,
                    onClick: () => { window.open('https://docs.hebo.ai', '_blank'); }
                }]}
            />
        </div>
    );
} 