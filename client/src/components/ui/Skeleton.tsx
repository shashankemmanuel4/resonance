import React from "react";
import { cn } from "../../lib/utils.js";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-subtle/80 animate-pulse rounded-md", className)}
      {...props}
    />
  );
};
