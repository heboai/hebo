import { cn } from "@hebo/shared-ui/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2", className)}>
      <img
        src="/hebo-icon.png"
        alt="Hebo AI Logo"
        width={32}
        height={32}
        loading="lazy"
        decoding="async"
      />
      <span className="truncate text-2xl font-semibold">hebo.ai</span>
    </div>
  );
}
