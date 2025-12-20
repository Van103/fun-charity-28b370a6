import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary-light hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg",
        outline:
          "border-2 border-secondary bg-transparent text-secondary hover:bg-secondary hover:text-secondary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary-light hover:shadow-lg hover:-translate-y-0.5",
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground",
        link:
          "text-secondary underline-offset-4 hover:underline",
        // Luxury variants
        hero:
          "bg-gradient-to-r from-secondary via-secondary-light to-secondary text-secondary-foreground shadow-lg hover:shadow-glow hover:-translate-y-1 active:translate-y-0 font-semibold border border-secondary-light/30",
        "hero-outline":
          "border-2 border-secondary/50 bg-transparent text-secondary hover:bg-secondary/10 hover:border-secondary",
        "hero-dark":
          "bg-primary text-primary-foreground shadow-lg hover:shadow-glow-purple hover:-translate-y-1 active:translate-y-0 font-semibold",
        gold:
          "bg-gradient-to-r from-secondary-dark via-secondary to-secondary-light text-secondary-foreground shadow-md hover:shadow-glow font-semibold",
        glass:
          "bg-card/60 backdrop-blur-lg border border-secondary/20 text-foreground hover:bg-card/80 hover:border-secondary/40 shadow-sm",
        wallet:
          "bg-primary text-primary-foreground border border-secondary/30 hover:border-secondary hover:shadow-glow font-mono",
        // Glassmorphism Glossy variants - like crypto promo buttons
        "glossy-green":
          "glossy-btn glossy-btn-green",
        "glossy-pink":
          "glossy-btn glossy-btn-pink",
        "glossy-orange":
          "glossy-btn glossy-btn-orange",
        "glossy-blue":
          "glossy-btn glossy-btn-blue",
        "glossy-purple":
          "glossy-btn glossy-btn-purple",
        "glossy-cyan":
          "glossy-btn glossy-btn-cyan",
        "glossy-gradient":
          "glossy-btn glossy-btn-gradient",
        // Feature button with glassmorphism hover
        feature:
          "feature-btn bg-gradient-to-r from-primary via-primary-light to-secondary text-white font-semibold shadow-lg",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
