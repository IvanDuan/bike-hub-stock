"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  titleId: titleIdProp,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  title?: string;
  titleId?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const titleId = titleIdProp ?? (title ? `${generatedId}-title` : undefined);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      role="presentation"
      onClick={onClose ? () => onClose() : undefined}
    >
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && titleId && (
          <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
