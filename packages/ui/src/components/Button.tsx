import {
  Button as ShadCNButton,
  buttonVariants,
} from "@hebo/ui/shadcn/ui/button";

import { cn } from "@hebo/ui/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ExtendedButtonProps = React.ComponentProps<typeof ShadCNButton> &
  VariantProps<typeof buttonVariants>;

export function Button({
  variant = "default",
  className,
  ...props
}: ExtendedButtonProps) {
  const extraClass =
    variant === "default" ? "border-2 border-indigo-600 hover:bg-accent" : "";

  return (
    <ShadCNButton
      variant={variant}
      className={cn(extraClass, className)}
      {...props}
    />
  );
}
