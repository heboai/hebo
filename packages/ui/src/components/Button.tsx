import { Loader2Icon } from "lucide-react";

import {
  Button as ShadCNButton,
  buttonVariants,
} from "@hebo/aikit-ui/_shadcn/ui/button";

import { cn } from "../lib/utils";

import type { VariantProps } from "class-variance-authority";

type ExtendedButtonProps = React.ComponentProps<typeof ShadCNButton> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export function Button({
  variant = "default",
  className,
  isLoading = false,
  children,
  disabled = false,
  ...props
}: ExtendedButtonProps) {
  return (
    <ShadCNButton
      variant={variant}
      className={cn("px-3", className)}
      aria-busy={isLoading}
      disabled={isLoading || disabled}
      {...props}
    >
      <span className="inline-flex items-center">
        {isLoading && (
          <Loader2Icon
            className="mr-2 h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        )}
        {/* FUTURE: Gerundify title, e.g. "Create" -> "Creating...." */}
        {children}
      </span>
    </ShadCNButton>
  );
}
