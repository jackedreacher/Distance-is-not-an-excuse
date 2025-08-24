import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  className,
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" className={cn("pixel-btn-icon", className)} {...props} />;
}

function DialogOverlay({
  className,
  tone = "default", // "default" | "darker" | "lighter"
  blur = true,
  ...props
}) {
  // Use rgba to keep neutral overlay while themes vary
  const toneClass = tone === "darker" ? "bg-[rgba(0,0,0,0.8)]" : tone === "lighter" ? "bg-[rgba(0,0,0,0.6)]" : "bg-[rgba(0,0,0,0.7)]";
  const blurClass = blur ? "backdrop-blur-sm" : "";
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50",
        toneClass,
        blurClass,
        className
      )}
      {...props} />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = false,
  overlayTone = "default",
  overlayBlur = true,
  ...props
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay tone={overlayTone} blur={overlayBlur} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Opaque content background with stronger shadow for prominence
          "bg-[var(--pixel-surface)] text-[var(--pixel-text)] fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-3 rounded-none border-2 border-[var(--pixel-border)] p-6 shadow-2xl duration-200 sm:max-w-lg",
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              // Pixel close button look and placement
              "absolute top-3 right-3 pixel-button outline pixel-btn-icon " ,
            )}>
            <span aria-hidden="true" className="pixel-x">×</span>
            <span className="sr-only">Kapat</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props} />
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-extrabold uppercase tracking-wide", className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-[var(--pixel-muted)]", className)}
      {...props} />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
