'use client';

import { useState } from 'react';
import { AInputBox } from '../../../../shared/components/forms';

export interface BottomInputBarProps {
  onPublish?: () => void;
  onModify?: (message: string) => void;
  placeholder?: string;
  publishLabel?: string;
  isLoading?: boolean;
}

export default function BottomInputBar({ 
  onPublish, 
  onModify, 
  placeholder = "Hens can modify it for you",
  publishLabel = 'Publish Changes',
  isLoading = false
}: BottomInputBarProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onModify?.(inputValue.trim());
      setInputValue('');
    }
  };

  const handlePublish = () => {
    onPublish?.();
  };

  return (
    <div className="flex justify-center px-4 pb-4">
      <div className="flex gap-4 items-center w-full max-w-4xl">
        {/* Input Container */}
        <div className="flex-1">
          <AInputBox
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            placeholder={placeholder}
            className="w-full"
            maxWidth="100%"
            disabled={isLoading}
          />
        </div>

        {/* Publish Button */}
        <div className="shrink-0">
          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="bg-[#484de6] disabled:opacity-50 disabled:cursor-not-allowed border-[#6976eb] border-[3px] border-solid box-border cursor-pointer flex gap-[7px] items-center justify-center overflow-visible px-8 py-3 relative rounded-[4px] shrink-0 w-[220px] hover:bg-[#3A3FE4] transition-colors duration-200"
          >
            <div className="relative shrink-0 size-[16px]">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-normal not-italic relative shrink-0 text-[#f8f8f8] text-[16px] text-nowrap whitespace-pre">
              {publishLabel}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
