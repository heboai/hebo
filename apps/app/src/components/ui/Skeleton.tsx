"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = 16,
  rounded = "rounded-md",
}) => {
  return (
    <div
      className={cn(
        "bg-gray-200 animate-pulse",
        rounded,
        className
      )}
      style={{ width, height }}
      aria-busy="true"
      aria-label="Loading..."
    />
  );
}; 