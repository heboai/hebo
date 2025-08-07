import {
  Button as ShadCNButton,
  buttonVariants,
} from "@hebo/ui/_shadcn/ui/button";

import { cn } from "@hebo/ui/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ExtendedButtonProps = React.ComponentProps<typeof ShadCNButton> &
  VariantProps<typeof buttonVariants>;

export function Button({
  variant = "default",
  className,
  ...props
}: ExtendedButtonProps) {
  const extraClass = variant === "default" ? "" : "";

  return (
    <ShadCNButton
      variant={variant}
      className={cn(extraClass, className)}
      {...props}
    />
  );
}
