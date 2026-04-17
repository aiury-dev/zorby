import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-2xl border border-[color:var(--color-border-default)] bg-white px-4 py-3 text-sm text-[color:var(--color-fg-default)] placeholder:text-[color:var(--color-fg-muted)] focus:border-[color:var(--color-brand-500)] focus:outline-none",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
