import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Pixel baseline, icon spacing and accessible focus
  "inline-flex items-center justify-center rounded-none border-2 px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-2 focus-visible:outline-[var(--pixel-accent-dark)] transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          // Default = outline pixel frame
          "bg-transparent text-[var(--pixel-text)] border-[var(--pixel-border)]",
        secondary:
          // Filled secondary look using pixel border color to stand out
          "bg-[var(--pixel-border)] text-[var(--pixel-text)] border-[var(--pixel-border-dark)]",
        destructive:
          "bg-[var(--pixel-accent)] text-[var(--pixel-text)] border-[var(--pixel-accent-dark)]",
        outline:
          "bg-transparent text-[var(--pixel-text)] border-[var(--pixel-border)]",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge }
