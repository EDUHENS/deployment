'use client';

import clsx from 'clsx';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalFrameProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
  closeButtonClassName?: string;
  closeButtonLabel?: string;
}

/**
 * Lightweight modal wrapper so student modals stay visually consistent.
 */
export default function ModalFrame({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  contentClassName,
  showCloseButton = true,
  closeButtonClassName,
  closeButtonLabel = 'Close modal',
}: ModalFrameProps) {
  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6',
        overlayClassName,
      )}
      role="dialog"
      aria-modal="true"
    >
      <div className={clsx('relative w-full rounded-3xl border border-[#e6e6e6] bg-white shadow-xl', className)}>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeButtonLabel}
            className={clsx(
              'absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600',
              closeButtonClassName,
            )}
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className={clsx('px-8 py-10', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
