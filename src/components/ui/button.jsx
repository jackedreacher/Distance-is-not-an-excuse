import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "pixel-button",
  {
    variants: {
      variant: {
        default: "",
        outline: "outline",
        destructive: "",
        secondary: "",
        ghost: "",
        link: "",
      },
      size: {
        default: "",
        sm: "pixel-btn-sm",
        lg: "pixel-btn-lg",
        icon: "pixel-btn-icon",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props} />
  );
}

export { Button }
