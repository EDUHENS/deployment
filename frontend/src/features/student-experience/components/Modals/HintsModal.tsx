'use client';

import { CircleX } from 'lucide-react';

export default function HintsModal({
  isOpen,
  onClose,
  hints = [],
  nextSteps = [],
  issues = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  hints?: string[];
  nextSteps?: string[];
  issues?: string[];
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Hens Hints</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
            <CircleX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {Array.isArray(hints) && hints.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Hints</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                {hints.map((h, i) => (<li key={i}>{h}</li>))}
              </ul>
            </div>
          )}
          {Array.isArray(nextSteps) && nextSteps.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Next steps</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                {nextSteps.map((h, i) => (<li key={i}>{h}</li>))}
              </ul>
            </div>
          )}
          {Array.isArray(issues) && issues.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Likely issues</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                {issues.map((h, i) => (<li key={i}>{h}</li>))}
              </ul>
            </div>
          )}
          {!(hints?.length || nextSteps?.length || issues?.length) && (
            <div className="text-sm text-gray-600">No hints available yet.</div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>
  );
}

