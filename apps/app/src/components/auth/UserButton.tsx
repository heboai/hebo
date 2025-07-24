"use client";

import { UserButton as StackUserButton } from "@stackframe/react";

import { useAuth } from "~/hooks/auth";
import { isStackAuth } from "~/lib/auth";

export function UserButton() {
  const auth = useAuth(true);

  if (isStackAuth) {
    return (
      <div className="w-10 h-10">
        <StackUserButton
          showUserInfo={false}
          extraItems={[
            {
              text: "Documentation",
              icon: null,
              onClick: () => {
                window?.open?.("https://docs.hebo.ai", "_blank");
              },
            },
          ]}
        />
      </div>
    );
  }

  // No auth configured, show dummy
  return (
    <div className="w-10 h-10 rounded-4xl flex justify-center items-center text-xs font-semibold bg-gray-200 ">
      {auth.user.initials}
    </div>
  );
}
