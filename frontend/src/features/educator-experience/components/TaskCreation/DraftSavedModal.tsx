'use client';

import Image from 'next/image';
import { CircleX } from 'lucide-react';

interface DraftSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeepEditing: () => void;
  onStartAnother: () => void;
}

export default function DraftSavedModal({ isOpen, onClose, onKeepEditing, onStartAnother }: DraftSavedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 py-[100px]">
      <div className="bg-[#f8f8f8] border-4 border-[#cccccc] border-solid relative rounded-[32px] w-[90vw] h-[calc(100vh-400px)] max-w-4xl flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 hover:animate-rotate-360 transition-colors duration-200 cursor-pointer"
        >
          <CircleX className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="flex flex-col gap-[72px] items-center justify-center flex-1 pb-[70px] pl-[160px] pr-[165px] pt-[80px]">
          <div className="flex flex-col gap-[48px] items-center">
            {/* Happy Hens Image */}
            <div className="h-[91px] w-[80px]">
              <Image
                src="/hens-main.svg"
                alt="Happy Hens"
                width={80}
                height={91}
                className="w-full h-full"
              />
            </div>
            
            {/* Message */}
            <div className="flex flex-col gap-[24px] items-center">
              <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[24px] text-center tracking-[0.48px]">
                Your draft is saved and ready to edit anytime.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-[8px] items-start">
            <button
              onClick={onKeepEditing}
              className="bg-white border border-[#cccccc] border-solid box-border content-stretch cursor-pointer flex gap-[7px] items-center justify-center overflow-visible px-[32px] py-[20px] relative rounded-[4px] shrink-0 w-[180px] hover:border-[#999999] transition-colors"
            >
              <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#595959] text-[16px] text-nowrap whitespace-pre">
                Keep editing
              </span>
            </button>
            <button
              onClick={onStartAnother}
              className="bg-[#484de6] box-border content-stretch flex gap-[7px] items-center justify-center px-[32px] py-[20px] relative rounded-[4px] shrink-0 w-[180px] hover:bg-[#3A3FE4] transition-colors cursor-pointer"
            >
              <span className="font-['Helvetica_Neue:Regular',sans-serif] text-[#f8f8f8] text-[16px] text-nowrap whitespace-pre">
                Start another task
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
