import { forwardRef } from "react";
import { cn } from "./cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-semibold text-text"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full min-h-11 rounded-xl border border-line-strong bg-surface px-4 py-3 text-base text-text placeholder:text-text-3 transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-negative focus:border-negative focus:ring-negative/20",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-negative">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";