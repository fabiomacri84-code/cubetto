import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent font-semibold text-white shadow-sm hover:bg-accent-strong active:bg-accent-strong",
  secondary:
    "border border-line-strong bg-surface font-medium text-text-2 shadow-sm hover:border-accent-line hover:text-accent-strong",
  tertiary: "font-medium text-text-2 hover:text-text",
  danger: "border border-negative/30 font-medium text-negative hover:bg-negative-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3.5 text-sm",
  md: "min-h-12 px-5 text-sm",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50";

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
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      title={title}
    >
      {children}
    </button>
  );
}