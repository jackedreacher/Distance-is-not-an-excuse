import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "pixel-retro border-2 border-[var(--pixel-border)] bg-transparent rounded-none px-3 py-2 text-base text-[var(--pixel-text)] shadow-none outline-none",
        "focus-visible:border-[var(--pixel-accent-dark)]",
        className
      )}
      {...props} />
  );
}

export { Input }
