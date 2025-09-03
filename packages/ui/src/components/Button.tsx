import { Loader2Icon } from "lucide-react";

import { Button as ShadCNButton, buttonVariants } from "../_shadcn/ui/button";
import { cn } from "../lib/utils";

// export { ShadCNButton as Button }

import type { VariantProps } from "class-variance-authority";

type ExtendedButtonProps = React.ComponentProps<typeof ShadCNButton> &
  VariantProps<typeof buttonVariants> & {
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
