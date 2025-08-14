import { CopyToClipboardButton } from "@hebo/shared-ui/_mintlify/code/CopyToClipboardButton";

import { Input as ShadCNInput } from "../../../aikit-ui/src/_shadcn/ui/input";
import { cn } from "../../../aikit-ui/src/lib/utils";

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
        <Icon size={16} className="absolute top-1/2 left-3 -translate-y-1/2" />
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
        className={cn(className, Icon ? "pl-9 bg-background" : "")}
        {...props}
      />
    </div>
  );
}
