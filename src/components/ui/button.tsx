import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none rounded-md text-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] transition-[scale,background-color,color,box-shadow] duration-150 ease-out",
  {
    variants: {
      variant: {
        primary:
          "bg-navy text-navy-fg shadow-[var(--shadow-border)] hover:bg-navy-deep",
        secondary:
          "bg-surface text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        ghost: "bg-transparent text-ink hover:bg-paper-sunken",
        danger: "bg-danger text-surface hover:bg-power",
        outline: "bg-transparent text-ink shadow-[var(--shadow-border)] hover:bg-surface-2",
      },
      size: {
        sm: "min-h-10 px-3 text-sm",
        md: "min-h-12 px-4 text-[0.95rem]",
        lg: "min-h-14 px-5 text-base",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
