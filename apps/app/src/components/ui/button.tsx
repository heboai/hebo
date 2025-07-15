import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@hebo/ui"
import {
  Button as ShadcnButton,
  buttonVariants as shadcnButtonVariants,
} from "@hebo/ui/shadcn/button"

const extendedButtonVariants = cva("", {
  variants: {
    variant: {
      tertiary:
        "bg-tertiary text-tertiary-foreground shadow-xs hover:bg-tertiary/80 rounded-sm",
    },
  },
})

type ExtendedButtonVariantProps = Omit<
  VariantProps<typeof shadcnButtonVariants>,
  "variant"
> & {
  variant?: VariantProps<typeof shadcnButtonVariants>["variant"] | "tertiary"
}

type ButtonProps = React.ComponentProps<"button"> & ExtendedButtonVariantProps

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        size={size}
        variant={variant === "tertiary" ? "default" : variant}
        className={cn(
          variant === "tertiary" &&
          extendedButtonVariants({
            variant,
          }),
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, shadcnButtonVariants as buttonVariants }
