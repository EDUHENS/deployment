'use client';

import { Sparkles, Send } from 'lucide-react';
import { useState } from 'react';

export interface AIInputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxWidth?: string;
  className?: string;
  disabled?: boolean;
}

export default function AIInputBox({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe your task shortly",
  maxWidth = "900px",
  className = "",
  disabled = false
}: AIInputBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      setIsSubmitting(true);
      onSubmit();
      // Reset animation after a short delay
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit && value.trim()) {
      setIsSubmitting(true);
      onSubmit();
      // Reset animation after a short delay
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div 
      className={`relative inline-block w-full ${className}`}
      style={{ maxWidth }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Floating particles effect on hover */}
      {isHovered && !isFocused && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute top-2 left-4 w-1 h-1 bg-[#F15A24] rounded-full animate-ping opacity-60"></div>
          <div className="absolute top-4 right-8 w-1 h-1 bg-[#484DE6] rounded-full animate-ping opacity-60" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-3 left-8 w-1 h-1 bg-[#C948E6] rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>
        </div>
      )}

      {/* Main input container */}
      <div 
        className={`
          relative w-full max-h-[300px] border rounded-lg transition-all duration-500 ease-out z-10
          ${isFocused 
            ? 'border-[#6c7ce7] bg-[#fafbff] shadow-[0_0_0_3px_rgba(108,124,231,0.1),0_4px_20px_rgba(108,124,231,0.15)] -translate-y-px scale-[1.02]' 
            : isHovered
            ? 'border-[#F15A24] bg-white shadow-[0_8px_25px_rgba(241,90,36,0.15)] -translate-y-[2px] scale-[1.01] animate-float-gentle'
            : 'border-gray-300 bg-white shadow-none'
          }
        `}
      >
        {/* Content */}
        <div className="flex items-center gap-5 p-6">
          <div className="flex-1 flex items-center gap-2">
            <Sparkles 
              className={`w-3.5 h-3.5 transition-all duration-500 ${
                isSubmitting
                  ? 'text-[#F15A24] animate-sparkle-rotate' 
                  : isFocused
                  ? 'text-[#6c7ce7] animate-pulse'
                  : isHovered
                  ? 'text-[#F15A24]'
                  : 'text-gray-400'
              }`} 
              fill="currentColor" 
            />
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              className="flex-1 text-[#666666] text-base placeholder-[#666666] outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className={`w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${
              isHovered && !isFocused 
                ? 'text-[#F15A24] hover:scale-110 hover:rotate-12' 
                : isFocused
                ? 'text-[#6c7ce7] hover:scale-105'
                : 'text-gray-400 hover:scale-105'
            }`}
          >
            <Send className="w-4 h-4 transition-transform duration-300" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
