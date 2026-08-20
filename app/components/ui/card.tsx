import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={cn("card", padded && "p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}