import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "outline" | "light";

const VARIANT: Record<Variant, string> = {
  primary: "btn btn-primary",
  outline: "btn btn-outline",
  light: "btn btn-light",
};

export const buttonClass = (variant: Variant = "primary", extra = "") => `${VARIANT[variant]} ${extra}`.trim();

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className = "", children, ...rest }: LinkProps) {
  return (
    <Link className={buttonClass(variant, className)} {...rest}>
      {children}
    </Link>
  );
}
