"use client";

import UserDisplay from "@/components/auth/UserDisplay";
import { Logo } from "@/components/common/Logo";
import { InstallCommand } from "@/components/common/InstallCommand";
import { NewButton } from "@/components/common/NewButton";

export default function HomeContent() {
  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-4">
      <Logo />
      <UserDisplay />
      {/* the blue command bar */}
      <InstallCommand />
      <div className="flex items-center gap-4">
        <div className="hidden sm:block">
          <NewButton />
        </div>
        <p className="text-base text-[#666666] min-w-[333px]">
          Works with any LLM / agent framework,{" "}
          <a 
            href="https://docs.hebo.ai/hebo_eval" 
            className="underline text-[#4758F5]"
            target="_blank" 
            rel="noopener noreferrer"
          >
            learn more
          </a>
        </p>
      </div>
    </div>
  );
} 