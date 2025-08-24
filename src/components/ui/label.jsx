import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "pixel-retro text-sm font-bold uppercase tracking-wide",
        className
      )}
      {...props} />
  );
}

export { Label }
