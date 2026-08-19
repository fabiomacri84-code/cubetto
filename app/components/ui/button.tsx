import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent font-semibold text-white hover:bg-accent-strong active:bg-accent-strong",
  secondary:
    "border border-line-strong font-medium text-text-2 hover:border-line-strong hover:bg-surface-2 hover:text-text",
  tertiary: "font-medium text-text-2 hover:text-text",
  danger: "border border-error/40 font-medium text-error hover:bg-error/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "menu" | "dialog" | boolean;
  title?: string;
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  href,
  className,
  type,
  disabled,
  onClick,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-haspopup": ariaHasPopup,
  title,
}: ButtonProps) {
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel}
        title={title}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type ?? "button"}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      title={title}
      className={classes}
    >
      {children}
    </button>
  );
}
