"use client";

import { useEffect, useRef } from "react";

/**
 * Reusable confirmation modal.
 *
 * Props:
 *  - open        (boolean)  – whether the modal is visible
 *  - title       (string)   – heading text
 *  - message     (string)   – body text
 *  - confirmText (string)   – label for the confirm button (default "Delete")
 *  - cancelText  (string)   – label for the cancel button  (default "Cancel")
 *  - variant     ("danger" | "default") – colour scheme (default "danger")
 *  - loading     (boolean)  – show spinner / disable buttons while async work runs
 *  - onConfirm   (fn)       – called when user clicks confirm
 *  - onCancel    (fn)       – called when user clicks cancel or presses Escape
 *  - showConfirm (boolean)  – when false, only cancel button is shown (default true)
 */
export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message = "",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
  showConfirm = true,
}) {
  const cancelRef = useRef(null);

  // Focus the cancel button when the modal opens (safer default)
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape" && !loading) onCancel?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
      : "bg-black text-white hover:bg-black/80 focus:ring-black";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => {
        if (!loading) onCancel?.();
      }}
    >
      {/* Modal card */}
      <div
        className="mx-4 w-full max-w-md animate-[fadeScaleIn_150ms_ease-out] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        {variant === "danger" && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
        )}

        {/* Title */}
        <h3 className="text-center text-lg font-semibold text-foreground">{title}</h3>

        {/* Message */}
        {message && (
          <p className="mt-2 text-center text-sm text-[color:var(--color-light-1)]">{message}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            ref={cancelRef}
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="min-w-[5rem] rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)] focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50"
          >
            {cancelText}
          </button>
          {showConfirm && (
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`min-w-[5rem] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 disabled:opacity-60 ${confirmBtnClass}`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Deleting...
                </span>
              ) : (
                confirmText
              )}
            </button>
          )}
        </div>
      </div>

      {/* Keyframe animation (injected once) */}
      <style jsx global>{`
        @keyframes fadeScaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
