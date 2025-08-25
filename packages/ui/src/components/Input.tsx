import { cn } from "@hebo/aikit-ui/lib/utils";
import { CopyToClipboardButton } from "@hebo/ui/_mintlify/code/CopyToClipboardButton";
import { Input as ShadCNInput } from "@hebo/ui/_shadcn/ui/input";

import type { LucideIcon } from "lucide-react";

interface InputProps extends React.ComponentProps<"input"> {
  icon?: LucideIcon;
  copy?: boolean;
}

export function Input({
  icon: Icon,
  copy,
  value,
  onChange,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative w-full min-w-0">
      {Icon && (
        <Icon
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          aria-hidden="true"
          focusable="false"
        />
      )}
      {copy && (
        <CopyToClipboardButton
          textToCopy={value?.toString() ?? ""}
          className="absolute top-1/2 right-2 -translate-y-1/2"
        />
      )}
      <ShadCNInput
        value={value}
        onChange={onChange}
        className={cn(
          "bg-background text-sm",
          Icon && "pl-9",
          copy && "pr-8 truncate",
          className,
        )}
        {...props}
      />
    </div>
  );
}
