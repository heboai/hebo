import { cn } from "@hebo/aikit-ui/src/lib/utils";

import {
  Button as ShadCNButton,
  buttonVariants,
} from "../../../aikit-ui/src/_shadcn/ui/button";

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
