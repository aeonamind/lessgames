"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="gh-box w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold tracking-wide text-site-text">
          {title}
        </h2>
        <p className="mt-2 text-sm text-site-muted">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="gh-btn-default px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="gh-btn-primary px-4 py-2 text-sm"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
