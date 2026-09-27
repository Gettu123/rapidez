import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition-transform duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "h-12 bg-brand text-ink",
        dark: "h-12 bg-ink text-paper",
        quiet: "h-12 border border-line bg-sheet text-ink",
        signal: "h-12 bg-signal text-paper",
        ghost: "h-11 bg-transparent text-ink",
      },
      full: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", full: false },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, full, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, full }), className)}
      {...(asChild ? {} : { type: "button" as const })}
      {...props}
    />
  );
}
