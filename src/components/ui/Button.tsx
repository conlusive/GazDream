import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "outline" | "light";

const VARIANT: Record<Variant, string> = {
  primary: "group btn btn-primary",
  outline: "group btn btn-outline",
  light: "group btn btn-light",
};

export const buttonClass = (variant: Variant = "primary", extra = "") => `${VARIANT[variant]} ${extra}`.trim();

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-4 w-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-1 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; arrow?: boolean };

export function ButtonLink({ variant = "primary", arrow = true, className = "", children, ...rest }: LinkProps) {
  return (
    <Link className={buttonClass(variant, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
