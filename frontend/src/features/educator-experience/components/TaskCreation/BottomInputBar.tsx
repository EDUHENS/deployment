'use client';

import { useState } from 'react';
import { AInputBox } from '../../../../shared/components/forms';
import { PublishButton } from '../../../../shared/components/ui';

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
      <div className="flex gap-4 items-center w-full max-w-4xl shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        {/* Input Container */}
        <div className="flex-1">
          <AInputBox
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            placeholder={placeholder}
            maxWidth="100%"
            disabled={isLoading}
            fullWidth={true}
            borderRadius={4}
            verticalPadding={24}
            borderColors={{
              default: '#374151',
              hover: '#111827',
              focus: '#1d4ed8'
            }}
          />
        </div>

        {/* Publish Button */}
        <div className="shrink-0">
          <PublishButton
            onClick={handlePublish}
            disabled={isLoading}
            label={publishLabel}
            className="px-8 shrink-0 w-[220px]"
            style={{ 
              height: '100%', 
              paddingTop: '24px', 
              paddingBottom: '24px'
            }}
          />
        </div>
      </div>
    </div>
  );
}
