'use client';

import { useEffect } from 'react';

export type ToastKind = 'info' | 'success' | 'error';

export default function SimpleToast({
  message,
  kind = 'info',
  duration = 3000,
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

  const bg = kind === 'success' ? 'bg-green-600' : kind === 'error' ? 'bg-red-600' : 'bg-gray-800';

  return (
    <div className="fixed top-4 right-4 z-[1000]">
      <div className={`${bg} text-white shadow-lg rounded px-4 py-3 max-w-sm`}>{message}</div>
    </div>
  );
}

