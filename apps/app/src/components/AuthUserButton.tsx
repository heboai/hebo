"use client";

import { UserButton } from "@stackframe/stack";

interface AuthUserButtonProps {
    className?: string;
}

export default function AuthUserButton({ className }: AuthUserButtonProps) {
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