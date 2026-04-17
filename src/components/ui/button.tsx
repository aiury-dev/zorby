"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--color-brand-500)] text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:bg-[color:var(--color-brand-600)] hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(37,99,235,0.28)] active:translate-y-0",
        secondary:
          "border border-[color:var(--color-border-default)] bg-[color:var(--color-surface)] text-[color:var(--color-fg-default)] shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-muted)]",
        ghost:
          "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-fg-default)]",
        danger:
          "bg-[color:var(--color-danger)] text-white shadow-[0_14px_30px_rgba(220,38,38,0.18)] hover:-translate-y-0.5 hover:opacity-95",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);

Button.displayName = "Button";
