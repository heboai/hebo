"use client";

import { ReactNode } from "react";

import { Button as ShadcnButton } from "@hebo/ui/shadcn/ui/button";
import { cn } from "@hebo/ui/lib/utils"


interface ButtonProps {
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
  text: string;
  icon?: ReactNode;
  className?: string;
}

export function Button({ 
  variant = "default", 
  text, 
  icon, 
  className 
}: ButtonProps) {
  return (
    <ShadcnButton variant={variant} className={cn("cursor-pointer", className)}>
      {icon}
      {text}
    </ShadcnButton>
  );
} 