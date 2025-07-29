import { cn } from "@hebo/ui/lib/utils"
import { RotateCw } from "lucide-react"

interface LoadingProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "secondary" | "tertiary"
  fullPage?: boolean
}

export function Loading({ 
  className, 
  size = "md", 
  variant = "primary",
  fullPage = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  }

  const variantClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    tertiary: "text-tertiary"
  }

  return (
    <div className={cn(
      "flex items-center justify-center",
      fullPage ? "fixed inset-0 bg-background/80 backdrop-blur-sm" : "",
      className
    )}>
      <div className="flex items-center justify-center">
        <RotateCw 
          className={cn(
            "animate-spin",
            sizeClasses[size],
            variantClasses[variant]
          )} 
        />
      </div>
    </div>
  )
} 