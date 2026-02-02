"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-[family-name:var(--font-dm-sans)]",
  {
    variants: {
      variant: {
        primary:
          "bg-gold text-brown shadow-md hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm",
        secondary: "bg-wood-light text-brown shadow-sm hover:bg-wood",
        ghost:
          "bg-transparent text-brown-light underline underline-offset-2 hover:text-brown",
        action:
          "border-2 border-wood bg-cream text-brown hover:bg-wood rounded-full",
        actionPrimary:
          "border-2 border-gold bg-gold text-brown hover:brightness-110 rounded-full",
      },
      size: {
        default: "px-6 py-4 text-base rounded-lg",
        sm: "px-4 py-2 text-sm rounded-lg",
        lg: "px-8 py-5 text-lg rounded-lg",
        action: "px-6 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
