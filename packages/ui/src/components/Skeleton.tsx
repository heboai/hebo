import React from "react";
import { Skeleton as ShadCNSkeleton } from "@hebo/ui/_shadcn/ui/skeleton";

interface SkeletonProps extends React.ComponentProps<"div"> {
  count: number;
}

export function Skeleton({ count, className, ...props }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ShadCNSkeleton key={i} className={className} {...props} />
      ))}
    </>
  );
}
