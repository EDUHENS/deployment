'use client';

import { useEffect } from 'react';

export type ToastKind = 'info' | 'success' | 'error';

const palette: Record<ToastKind, { bg: string; border: string }> = {
  info: { bg: '#1D4ED8', border: '#93C5FD' },
  success: { bg: '#12B76A', border: '#A6F4C5' },
  error: { bg: '#F04438', border: '#FEB4A6' },
};

export default function SimpleToast({
  message,
  kind = 'info',
  duration = 2400,
  onClose,
}: {
  message: string;
  kind?: ToastKind;
  duration?: number;
  onClose?: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);

  const colors = palette[kind];

  return (
    <div className="fixed top-6 left-1/2 z-[2000] flex w-full max-w-2xl -translate-x-1/2 justify-center px-4 pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto toast-slide-in shadow-[0_12px_40px_rgba(15,23,42,0.18)] rounded-[999px] px-6 py-3 flex items-center gap-3 text-sm font-medium text-white"
        style={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        {message}
      </div>
    </div>
  );
}
