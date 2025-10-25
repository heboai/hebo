import { Loader2Icon } from "lucide-react";

import { Button as ShadCNButton } from "../_shadcn/ui/button";
import { cn } from "../lib/utils";

type ExtendedButtonProps = React.ComponentProps<typeof ShadCNButton> & {
  isLoading?: boolean;
};

export function Button({
  variant = "default",
  className,
  asChild,
  children,
  isLoading = false,
  disabled = false,
  ...props
}: ExtendedButtonProps) {
  return (
    <ShadCNButton
      asChild={asChild}
      variant={variant}
      className={cn("px-3", className)}
      aria-busy={isLoading}
      disabled={isLoading || disabled}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {/* FUTURE: Only show spinner after short delay to avoid flicker on fast actions */}
          {isLoading && (
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {/* FUTURE: Gerundify title, e.g. "Create" -> "Creating...." */}
          {children}
        </>
      )}
    </ShadCNButton>
  );
}
