"use client"

import React from "react"
import { cn } from "@hebo/ui/lib/utils"

/**
 * Footer Component
 * 
 * A reusable footer component based on the sidebar footer style.
 * 
 * @example
 * ```tsx
 * import { Footer } from "@hebo/ui/shadcn/ui/footer"
 * 
 * // Basic usage
 * <Footer>
 *   <p>Footer content</p>
 * </Footer>
 * 
 * // With border and custom padding
 * <Footer withBorder padding="lg">
 *   <button>Action 1</button>
 *   <button>Action 2</button>
 * </Footer>
 * 
 * // With custom className
 * <Footer className="bg-gray-100">
 *   <div>Custom styled footer</div>
 * </Footer>
 * ```
 */

interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes to apply to the footer
   */
  className?: string
  /**
   * The content to render inside the footer
   */
  children?: React.ReactNode
  /**
   * Whether the footer should have a border top
   */
  withBorder?: boolean
  /**
   * The padding size for the footer
   */
  padding?: "sm" | "md" | "lg"
}

const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, children, withBorder = false, padding = "md", ...props }, ref) => {
    const paddingClasses = {
      sm: "p-1",
      md: "p-2", 
      lg: "p-4"
    }

    return (
      <div
        ref={ref}
        data-slot="footer"
        className={cn(
          "flex flex-col gap-2",
          paddingClasses[padding],
          withBorder && "border-t border-border",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Footer.displayName = "Footer"

export { Footer }
export type { FooterProps }
