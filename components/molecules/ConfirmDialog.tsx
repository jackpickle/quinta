"use client";

import { Button } from "@/components/atoms/Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 bg-brown/60 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-cream rounded-xl max-w-xs w-full shadow-lg p-6 text-center">
        <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-normal mb-2">
          {title}
        </h3>
        <p className="text-brown-light text-sm leading-relaxed mb-4">{message}</p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="sm"
            className="w-full !bg-red-400 !text-white !shadow-none hover:!bg-red-500"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
