import type { LucideIcon } from "lucide-react";

import { cn } from "@hebo/ui/lib/utils";
import { CopyToClipboardButton } from "@hebo/ui/mintlify/code/CopyToClipboardButton";
import { Input as ShadCNInput } from "@hebo/ui/shadcn/ui/input";

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
        <Icon size={16} className="absolute top-1/2 -translate-y-1/2 left-3" />
      )}
      {copy && (
        <CopyToClipboardButton
          textToCopy={value?.toString() ?? ""}
          className="absolute top-1/2 -translate-y-1/2 right-2"
        />
      )}
      <ShadCNInput
        value={value}
        onChange={onChange}
        className={cn(className, Icon ? "pl-9 bg-background" : "")}
        {...props}
      />
    </div>
  );
}
