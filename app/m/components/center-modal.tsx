"use client";

import * as React from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CenterModal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/30"
        role="button"
        tabIndex={0}
        aria-label="Close"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="text-base font-semibold text-slate-900">{title}</div>
            <button
              onClick={onClose}
              className={cx(
                "rounded-full px-3 py-1.5 text-sm text-slate-700 ring-1 ring-inset ring-slate-200",
                "hover:bg-slate-50"
              )}
            >
              Close
            </button>
          </div>

          <div className="max-h-[70dvh] overflow-auto px-5 py-4">{children}</div>

          {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
