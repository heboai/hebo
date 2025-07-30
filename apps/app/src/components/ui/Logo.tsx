import Image from "next/image";

import { cn } from "@hebo/ui/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 overflow-hidden", className)}>
      <Image
        src="/hebo-icon.png"
        alt="Hebo AI Logo"
        width={32}
        height={32}
        priority
      />
      <span className="text-2xl font-semibold">hebo.ai</span>
    </div>
  );
}
