import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 text-sm text-[color:var(--color-fg-default)] placeholder:text-[color:var(--color-fg-muted)] focus:border-[color:var(--color-brand-500)] focus:outline-none",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
