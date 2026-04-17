import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-12 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white/96 px-4 text-sm text-[color:var(--color-fg-default)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-[color:var(--color-fg-subtle)] focus:border-[color:var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-[color:var(--color-border-strong)]",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
