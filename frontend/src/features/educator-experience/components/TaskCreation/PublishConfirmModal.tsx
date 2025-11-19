'use client';

import { useState } from 'react';
import CloseButton from '@/shared/components/ui/CloseButton';
import PublishButton from '@/shared/components/ui/PublishButton';
import { CopyIcon, ShareIcon } from '@/shared/components/ui';
import SimpleToast from '@/shared/components/ui/SimpleToast';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (opts: { accessCode: string }) => void;
  scheduledText?: string | { start: string; end: string } | null;
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
  const [isPasscodeFocused, setIsPasscodeFocused] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind?: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (!existingLink || existingLink === 'TaskLink') {
      setToast({ message: 'Link not available yet', kind: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(existingLink);
      setToast({ message: 'Link copied to clipboard!', kind: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback: select the text
      const textArea = document.createElement('textarea');
      textArea.value = existingLink;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        const success = document.execCommand('copy');
        if (success) {
          setToast({ message: 'Link copied to clipboard!', kind: 'success' });
          setTimeout(() => setToast(null), 3000);
        } else {
          throw new Error('execCommand failed');
        }
      } catch (e) {
        console.error('Fallback copy failed:', e);
        setToast({ message: 'Failed to copy. Please select and copy manually.', kind: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleShare = () => {
    if (existingLink && navigator.share) {
      navigator.share({ url: existingLink });
    } else if (existingLink) {
      window.open(existingLink, '_blank');
    }
  };

  const handleCopyPasscode = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm">
      <div className="bg-[#f8f8f8] border-4 border-[#cccccc] border-solid relative rounded-[32px] w-full max-w-4xl flex flex-col overflow-hidden shadow-[3px_12px_80px_10px_rgba(34,34,34,0.10)]">
        {/* Close Button */}
        <div className="absolute right-4 top-4 z-10">
          <CloseButton onClick={onClose} size="md" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-[72px] items-center justify-center px-[60px] pt-[80px] pb-[40px]">
          {/* Title Section */}
          <div className="flex flex-col gap-[24px] items-start w-full">
            <h2 className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[24px] tracking-[0.48px] text-left w-full">
              Task Ready to publish
            </h2>
            <div className="flex flex-col gap-[8px] items-start w-full">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[16px] tracking-[0.32px] leading-[normal] w-full">
                Review final details before sharing your task with students.
              </p>
              {hasSchedule && scheduledText ? (
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[16px] tracking-[0.32px] leading-[normal] w-full">
                  Your task is scheduled to{' '}
                  {typeof scheduledText === 'object' ? (
                    <>
                      <span className="font-['Helvetica_Neue:Bold',sans-serif] text-green-600">{scheduledText.start}</span>
                      {' – '}
                      <span className="font-['Helvetica_Neue:Bold',sans-serif] text-red-600">{scheduledText.end}</span>
                    </>
                  ) : (
                    <span className="font-['Helvetica_Neue:Bold',sans-serif]">{scheduledText}</span>
                  )}
                </p>
              ) : (
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[16px] tracking-[0.32px] leading-[normal] w-full">
                  This will be published as an <span className="font-['Helvetica_Neue:Bold',sans-serif]">Open task</span> <span className="font-['Helvetica_Neue:Bold',sans-serif] text-red-600">(no due date)</span>.
                  {onAddSchedule && (
                    <>
                      {' '}
                      <button
                        onClick={onAddSchedule}
                        className="underline text-[#484de6] cursor-pointer hover:text-[#3A3FE4] transition-colors"
                      >
                        Set due date
                      </button>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Main Content - Full Width Column */}
          <div className="flex flex-col gap-[52px] items-start w-full max-w-[800px]">
            {/* Share your task - Full Width */}
            <div className="flex flex-col gap-[16px] items-start w-full">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px] leading-[normal] w-full">
                Share your task
              </p>
              <div className="flex flex-col gap-[8px] items-start w-full">
                <div className="bg-white border border-[#cccccc] border-solid rounded-[4px] w-full">
                  <div className="flex items-center justify-between px-[16px] py-[20px] gap-3">
                    <p 
                      className="font-['Helvetica_Neue:Regular',sans-serif] text-[#484de6] text-[16px] tracking-[0.32px] underline flex-1 truncate select-all cursor-text"
                      onClick={() => {
                        if (existingLink && existingLink !== 'TaskLink') {
                          handleCopyLink();
                        }
                      }}
                      title={existingLink && existingLink !== 'TaskLink' ? 'Click to copy' : ''}
                    >
                      {existingLink && existingLink !== 'TaskLink' ? existingLink : 'TaskLink'}
                    </p>
                    <div className="flex gap-[32px] items-center shrink-0 text-[#999999]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink();
                        }}
                        disabled={!existingLink || existingLink === 'TaskLink'}
                        className={`transition-all duration-200 ${existingLink && existingLink !== 'TaskLink' ? 'cursor-pointer hover:text-[#484de6] hover:scale-110' : 'opacity-40 cursor-not-allowed text-[#c2c2c2]'}`}
                        title="Copy link"
                      >
                        <CopyIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare();
                        }}
                        disabled={!existingLink || existingLink === 'TaskLink'}
                        className={`transition-all duration-200 ${existingLink && existingLink !== 'TaskLink' ? 'cursor-pointer hover:text-[#484de6] hover:scale-110' : 'opacity-40 cursor-not-allowed text-[#c2c2c2]'}`}
                        title="Share link"
                      >
                        <ShareIcon className="w-[17px] h-[22px]" />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[14px] tracking-[0.28px] leading-[normal] pl-[4px]">
                  You can always get your link from task studio
                </p>
              </div>
            </div>

            {/* Passcode - Full Width Below Link */}
            <div className="flex flex-col gap-[16px] items-start w-full">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px] leading-[normal] w-full">
                Passcode
              </p>
              <div className="flex flex-col gap-[8px] items-start w-full">
                <div className="bg-white border border-[#E9EAEB] border-solid rounded-[4px] w-full transition hover:border-[#6d74ff] focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#6d74ff] focus-within:outline-none">
                  <div className="flex items-center px-[16px] py-[20px] gap-4">
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      onFocus={() => setIsPasscodeFocused(true)}
                      onBlur={() => setIsPasscodeFocused(false)}
                      placeholder={isPasscodeFocused || accessCode ? '' : 'Enter passcode'}
                      className="flex-1 font-['Helvetica_Neue:Regular',sans-serif] text-[24px] tracking-[0.48px] leading-[normal] outline-none bg-transparent placeholder:text-[#666666] placeholder:text-[16px] cursor-text text-[#222222]"
                    />
                    <button
                      onClick={handleCopyPasscode}
                      disabled={!accessCode}
                      className={`transition-all duration-200 shrink-0 ${accessCode ? 'cursor-pointer text-[#999999] hover:text-[#484de6] hover:scale-110' : 'opacity-40 cursor-not-allowed text-[#c2c2c2]'}`}
                      title="Copy passcode"
                    >
                      <CopyIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[14px] tracking-[0.28px] leading-[normal] pl-[4px]">
                  Code name of class is a commonly used password
                </p>
              </div>
            </div>
          </div>

          {/* Publish Button */}
          <PublishButton
            onClick={() => onConfirm({ accessCode })}
            className="px-[32px] py-[12px] w-full"
          />
        </div>
      </div>
      {toast && (
        <SimpleToast
          message={toast.message}
          kind={toast.kind}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
