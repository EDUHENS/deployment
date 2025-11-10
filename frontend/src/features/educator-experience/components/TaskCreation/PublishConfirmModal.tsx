'use client';

import { useState } from 'react';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (opts: { accessCode: string }) => void;
  scheduledText?: string | null;
  existingLink?: string | null;
  hasSchedule?: boolean;
  onAddSchedule?: () => void;
}

export default function PublishConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  scheduledText,
  existingLink,
  hasSchedule = false,
  onAddSchedule,
}: PublishConfirmModalProps) {
  const [accessCode, setAccessCode] = useState('');
  const [show, setShow] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-[24px] border border-[#cccccc] bg-[#f8f8f8] shadow-2xl">
        {/* Header */}
        <div className="px-8 pt-8">
          <h2 className="text-[24px] tracking-wide text-[#222] text-center">Task Ready to publish</h2>
          <p className="mt-2 text-[16px] text-[#222] text-center">Review final details before sharing your task with students.</p>
          <p className="mt-1 text-[16px] text-[#222] text-center">
            {hasSchedule && scheduledText ? (
              <>Your task is scheduled to <span className="font-semibold">{scheduledText}</span></>
            ) : (
              <>
                This will be published as an <span className="font-semibold">Open task</span> (no due date).
                {onAddSchedule && (
                  <>
                    {' '}<button onClick={onAddSchedule} className="underline text-[#484de6]">Set due date</button>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Share link */}
            <div className="flex flex-col gap-2">
              <p className="text-[20px] text-[#222]">Share your task</p>
              <div className="rounded border border-[#ccc] bg-white">
                <div className="flex items-center justify-between px-3 py-3 gap-3">
                  <p className="text-[16px] text-[#484de6] underline truncate">
                    {existingLink ? existingLink : 'Will be generated after publish'}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      disabled={!existingLink}
                      onClick={() => existingLink && navigator.clipboard.writeText(existingLink)}
                      className={`text-[#222] text-sm px-2 py-1 border rounded ${existingLink ? 'hover:opacity-70' : 'opacity-50 cursor-not-allowed'}`}
                    >Copy</button>
                    <button
                      disabled={!existingLink}
                      onClick={() => existingLink && (window.open(existingLink, '_blank'))}
                      className={`text-[#222] text-sm px-2 py-1 border rounded ${existingLink ? 'hover:opacity-70' : 'opacity-50 cursor-not-allowed'}`}
                    >Open</button>
                  </div>
                </div>
              </div>
              <p className="text-[14px] text-[#595959]">
                {existingLink ? 'You can always get your link from task studio' : 'Share link will be provided after publish'}
              </p>
            </div>

            {/* Passcode */}
            <div className="flex flex-col gap-2">
              <p className="text-[20px] text-[#222]">Passcode</p>
              <div className="rounded border border-[#ccc] bg-white">
                <div className="flex items-center px-3 py-3 gap-2">
                  <input
                    type={show ? 'text' : 'password'}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="****"
                    className="flex-1 text-[16px] outline-none"
                  />
                  <button onClick={() => setShow((v) => !v)} className="text-[#222] hover:opacity-70 text-sm px-2 py-1 border rounded">
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <p className="text-[14px] text-[#595959]">Code name of class is a commonly used password</p>
            </div>
          </div>

          {/* AI toggle */}
          <div className="mt-8">
            <p className="text-[20px] text-[#222]">Toggle AI assessment</p>
            <div className={`mt-3 rounded border-2 ${aiEnabled ? 'border-[#222]' : 'border-[#ccc]'} bg-white` }>
              <div className="flex items-center justify-between px-4 py-4">
                <p className="text-[16px] text-[#222]"><span className="font-bold italic text-[#484de6]">Hens</span> can assess submissions for you</p>
                <button
                  onClick={() => setAiEnabled((v) => !v)}
                  className={`relative inline-flex h-[28px] w-[64px] items-center rounded-full ${aiEnabled ? 'bg-[#39b54a]' : 'bg-[#cccccc]'}`}
                >
                  <span className={`inline-block h-[24px] w-[24px] transform rounded-full bg-[#f8f8f8] shadow transition-transform ${aiEnabled ? 'translate-x-[36px]' : 'translate-x-[4px]'}`}/>
                </button>
              </div>
            </div>
            <p className="mt-2 text-[14px] text-[#595959]">You will decide the final grades, <span className="font-bold italic text-[#484de6]">Hens</span> is your mere assistant.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex justify-end">
          <button onClick={onClose} className="mr-3 px-4 py-2 rounded border border-[#e6e6e6] text-[#444] hover:bg-white">Cancel</button>
          <button
            onClick={() => onConfirm({ accessCode })}
            className="px-6 py-2 rounded bg-[#484de6] text-white hover:bg-[#3A3FE4]"
          >
            Publish Task
          </button>
        </div>
      </div>
    </div>
  );
}
