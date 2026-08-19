import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

const baseClasses =
  "min-h-11 w-full rounded-md border border-line-strong bg-subtle px-3 py-2 text-sm text-text transition-colors duration-150 outline-none placeholder:text-text-3 focus:border-accent disabled:cursor-not-allowed disabled:opacity-60";

export function Input({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(baseClasses, className)} {...props} />;
}
