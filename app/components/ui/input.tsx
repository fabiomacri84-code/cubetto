import type { ComponentProps } from "react";
import { cn } from "./cn";

const baseClasses =
  "min-h-12 w-full rounded-xl border border-line-strong bg-surface px-4 py-2 text-base text-text shadow-sm transition-colors duration-150 outline-none placeholder:text-text-3 focus:border-accent disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ref, ...props }: ComponentProps<"input">) {
  return <input ref={ref} className={cn(baseClasses, className)} {...props} />;
}