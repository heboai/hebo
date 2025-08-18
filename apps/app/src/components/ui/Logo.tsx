import Image from "next/image";

import { cn } from "@hebo/aikit-ui/src/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2", className)}>
      <Image
        src="/hebo-icon.png"
        alt="Hebo AI Logo"
        width={32}
        height={32}
        priority
      />
      <span className="truncate text-2xl font-semibold">hebo.ai</span>
    </div>
  );
}
