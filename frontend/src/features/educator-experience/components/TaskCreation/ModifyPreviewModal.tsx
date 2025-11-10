'use client';

import React from 'react';
import { CircleX } from 'lucide-react';

export type ModifyMode = 'append' | 'reorder' | 'replace';

export default function ModifyPreviewModal({
  isOpen,
  mode,
  beforeSteps = [],
  afterSteps = [],
  addedSteps = [],
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  mode: ModifyMode;
  beforeSteps?: string[];
  afterSteps?: string[];
  addedSteps?: string[];
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Apply Hens Changes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
            <CircleX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {mode === 'append' && (
            <div>
              <h3 className="text-base font-semibold mb-2">New steps to append</h3>
              {addedSteps.length ? (
                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-800">
                  {addedSteps.map((s, i) => (<li key={i}>{s}</li>))}
                </ol>
              ) : (
                <div className="text-sm text-gray-600">No new steps detected.</div>
              )}
            </div>
          )}
          {mode === 'reorder' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-semibold mb-2">Before</h3>
                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-800">
                  {beforeSteps.map((s, i) => (<li key={i}>{s}</li>))}
                </ol>
              </div>
              <div>
                <h3 className="text-base font-semibold mb-2">After</h3>
                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-800">
                  {afterSteps.map((s, i) => (<li key={i}>{s}</li>))}
                </ol>
              </div>
            </div>
          )}
          {mode === 'replace' && (
            <div>
              <h3 className="text-base font-semibold mb-2">Proposed steps</h3>
              <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-800">
                {afterSteps.map((s, i) => (<li key={i}>{s}</li>))}
              </ol>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Apply</button>
        </div>
      </div>
    </div>
  );
}

