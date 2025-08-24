import React from "react";

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9998]">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-md border border-border bg-background shadow-xl">
          {title ? (
            <div className="px-4 py-2 border-b border-border/50 text-sm font-medium">{title}</div>
          ) : null}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}


