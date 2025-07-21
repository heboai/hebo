"use client";

import { ReactNode } from "react";
import { Button } from "./base/Button";

interface ActionButtonProps {
  variant?: "secondary" | "tertiary";
  text: string;
  icon?: ReactNode;
  className?: string;
}

export function ActionButton({ 
  variant = "secondary", 
  text, 
  icon, 
  className 
}: ActionButtonProps) {
  return (
    <Button variant={variant} className={className}>
      {icon}
      {text}
    </Button>
  );
} 