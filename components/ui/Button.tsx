import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-[#1a1408] shadow-[0_8px_24px_rgba(224,179,74,0.28)] hover:bg-gold-deep",
  secondary:
    "border border-line bg-surface/80 text-foreground hover:border-gold/50 hover:bg-surface",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className = "",
) {
  return `inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-base font-semibold tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, className)}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClassName(variant, className)}>
      {children}
    </Link>
  );
}
