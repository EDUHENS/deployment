'use client';

import Image from 'next/image';
import PublishButton from '@/shared/components/ui/PublishButton';
import CloseButton from '@/shared/components/ui/CloseButton';
import { CopyIcon, ShareIcon } from '@/shared/components/ui';
import { useState } from 'react';

interface TaskReadyToPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish?: () => void;
  taskSchedule?: string | null;
  taskLink?: string | null;
  passcode?: string | null;
}

export default function TaskReadyToPublishModal({ 
  isOpen, 
  onClose,
  onPublish,
  taskSchedule = null,
  taskLink = null,
  passcode = null
}: TaskReadyToPublishModalProps) {
  const [isAIEnabled, setIsAIEnabled] = useState(true);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!taskLink) return;
    navigator.clipboard.writeText(taskLink);
  };

  const handleShare = () => {
    if (!taskLink) return;
    if (navigator.share) {
      navigator.share({ url: taskLink }).catch(() => {});
    } else {
      window.open(taskLink, '_blank', 'noopener');
    }
  };

  const handleCopyPasscode = () => {
    if (!passcode) return;
    navigator.clipboard.writeText(passcode);
  };

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-[#f8f8f8] border-4 border-[#cccccc] border-solid relative rounded-[32px] w-full max-w-4xl flex flex-col overflow-hidden">
        {/* Close Button */}
        <CloseButton onClick={onClose} className="absolute right-4 top-4 z-10" size="md" />

        {/* Content */}
        <div className="flex flex-col gap-18 items-center justify-center px-15 py-20">
          {/* Title Section */}
          <div className="flex flex-col gap-6 items-start w-full">
            <h2 className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[24px] tracking-[0.48px] text-center w-full">
              Task Ready to publish
            </h2>
            <div className="flex flex-col gap-2">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                Review final details before sharing your task with students.
              </p>
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                {taskSchedule ? (
                  <>
                    Your task is scheduled to <span className="font-['Helvetica_Neue:Bold',sans-serif]">{taskSchedule}</span>
                  </>
                ) : (
                  'No schedule defined yet.'
                )}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-13 items-start w-full max-w-[800px] mt-18">
            {/* Share and Passcode Row */}
            <div className="flex gap-4 items-start w-full">
              {/* Share your task */}
              <div className="flex flex-col gap-4 flex-1">
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px]">
                  Share your task
                </p>
                <div className="flex flex-col gap-2">
                  <div className="bg-white border border-[#cccccc] border-solid rounded-[4px] w-full">
                    <div className="flex items-center justify-between px-4 py-5">
                      <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#484de6] text-[16px] tracking-[0.32px] underline flex-1 truncate">
                        {taskLink || 'Task link not available'}
                      </p>
                      <div className="flex gap-8 items-center text-[#999999]">
                        <button
                          onClick={handleCopyLink}
                          disabled={!taskLink}
                          className={`transition-all duration-200 ${taskLink ? 'cursor-pointer hover:text-[#484de6] hover:scale-110' : 'cursor-not-allowed opacity-40'}`}
                        >
                          <CopyIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleShare}
                          disabled={!taskLink}
                          className={`transition-all duration-200 ${taskLink ? 'cursor-pointer hover:text-[#484de6] hover:scale-110' : 'cursor-not-allowed opacity-40'}`}
                        >
                          <ShareIcon className="w-[17px] h-[22px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[14px] tracking-[0.28px] pl-1">
                    You can always get your link from task studio
                  </p>
                </div>
              </div>

              {/* Passcode */}
              <div className="flex flex-col gap-4 flex-1">
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px]">
                  Passcode
                </p>
                <div className="flex flex-col gap-2">
                  <div className="bg-white border border-[#cccccc] border-solid rounded-[4px] w-full">
                    <div className="flex items-center justify-between gap-4 px-4 py-5">
                      <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[24px] tracking-[0.48px] flex-1">
                        {passcode || '—'}
                      </p>
                      <button
                        onClick={handleCopyPasscode}
                        disabled={!passcode}
                        className={`text-[#999999] transition-all duration-200 ${passcode ? 'cursor-pointer hover:text-[#484de6] hover:scale-110' : 'cursor-not-allowed opacity-40'}`}
                        title="Copy passcode"
                      >
                        <CopyIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[14px] tracking-[0.28px] pl-1">
                    Code name of class is a commonly used password
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle AI Assessment */}
            <div className="flex flex-col gap-6 items-start w-full mt-6">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[20px] tracking-[0.4px]">
                Toggle AI assessment
              </p>
              <div className="flex flex-col gap-3 w-full">
                <div className={`bg-white border-2 ${isAIEnabled ? 'border-[#222222]' : 'border-[#cccccc]'} border-solid rounded-[4px] w-full transition-colors`}>
                  <div className="flex items-center justify-between px-4 py-5">
                    <div className="flex gap-3 items-center">
                      <div className="w-[30px] h-[34px]">
                        <Image
                          src="/hens-main.svg"
                          alt="Hens"
                          width={30}
                          height={34}
                          className="w-full h-full"
                        />
                      </div>
                      <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                        <span className="font-nunito font-bold italic text-[#484de6]">
                          Hens
                        </span>
                        {' '}can assess submissions for you
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAIEnabled(!isAIEnabled)}
                      className={`relative inline-flex h-[34px] w-[74px] items-center rounded-full transition-colors cursor-pointer ${
                        isAIEnabled ? 'bg-[#39b54a]' : 'bg-[#cccccc]'
                      }`}
                    >
                      <span
                        className={`inline-block h-[30px] w-[30px] transform rounded-full bg-[#f8f8f8] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-transform ${
                          isAIEnabled ? 'translate-x-[42px]' : 'translate-x-[2px]'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[14px] tracking-[0.28px]">
                  You will decide the final grades, <span className="font-nunito font-bold italic text-[#484de6]">Hens</span> is your mere assistant.
                </p>
              </div>
            </div>
          </div>

          {/* Publish Button */}
          <div className="mt-6">
            <PublishButton
              onClick={onPublish || (() => {})}
              className="px-8 py-3 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
