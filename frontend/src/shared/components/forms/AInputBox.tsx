'use client';

import { Send } from 'lucide-react';
import { useRef, useState } from 'react';

export interface AIInputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxWidth?: string;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  borderRadius?: number;
  verticalPadding?: number;
  borderColors?: {
    default: string;
    hover: string;
    focus: string;
  };
}

// Sparkles SVG component that transitions from default to hover state
const SparklesIcon = ({ isHovered }: { isHovered: boolean }) => {
  // Use the 18x18 viewBox for both states, scale and rotate for smooth transition
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="18" 
      height="18" 
      viewBox="0 0 18 18" 
      fill="none"
      className="transition-all duration-300 ease-in-out"
      style={{
        transform: isHovered ? 'rotate(180deg) scale(1)' : 'rotate(0deg) scale(0.7778)', // 14/18 = 0.7778
        transformOrigin: 'center'
      }}
    >
      <defs>
        <linearGradient id="sparkles-gradient" x1="9.00011" y1="-7.62939e-05" x2="9.00011" y2="17.9998" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C948E6"/>
          <stop offset="1" stopColor="#484DE6"/>
        </linearGradient>
        <clipPath id="clip0_773_23355">
          <rect width="18" height="18" fill="white" transform="matrix(-1 0 0 -1 18 18)"/>
        </clipPath>
      </defs>
      <g clipPath="url(#clip0_773_23355)">
        <path 
          d="M7.3128 17.9998C7.13503 18.0007 6.96122 17.9474 6.8146 17.8468C6.66797 17.7463 6.55551 17.6035 6.49225 17.4373L5.09163 13.7951C5.06326 13.7217 5.01987 13.6551 4.96423 13.5995C4.90859 13.5438 4.84194 13.5004 4.76854 13.4721L1.1253 12.0704C0.959342 12.0067 0.8166 11.8942 0.715911 11.7477C0.615222 11.6012 0.561321 11.4276 0.561321 11.2498C0.561321 11.0721 0.615222 10.8985 0.715911 10.752C0.8166 10.6055 0.959342 10.493 1.1253 10.4293L4.76749 9.02866C4.84088 9.00029 4.90753 8.95689 4.96317 8.90125C5.01881 8.84562 5.06221 8.77896 5.09057 8.70557L6.49225 5.06233C6.55595 4.89637 6.66847 4.75363 6.81496 4.65294C6.96146 4.55225 7.13504 4.49835 7.3128 4.49835C7.49056 4.49835 7.66414 4.55225 7.81064 4.65294C7.95713 4.75363 8.06965 4.89637 8.13335 5.06233L9.53397 8.70451C9.56234 8.77791 9.60573 8.84456 9.66137 8.9002C9.71701 8.95584 9.78366 8.99923 9.85706 9.0276L13.4782 10.4208C13.6509 10.4849 13.7997 10.6005 13.9043 10.7522C14.0089 10.9038 14.0642 11.0839 14.0628 11.2681C14.0601 11.4428 14.0051 11.6126 13.9048 11.7556C13.8045 11.8987 13.6636 12.0083 13.5003 12.0704L9.85811 13.471C9.78472 13.4994 9.71806 13.5428 9.66243 13.5984C9.60679 13.654 9.56339 13.7207 9.53503 13.7941L8.13335 17.4373C8.07008 17.6035 7.95763 17.7463 7.811 17.8468C7.66438 17.9474 7.49057 18.0007 7.3128 17.9998ZM3.09405 6.18733C2.98983 6.18732 2.88806 6.15574 2.80214 6.09675C2.71623 6.03776 2.6502 5.95412 2.61276 5.85686L2.02003 4.31561C2.00718 4.2819 1.98735 4.25129 1.96184 4.22578C1.93634 4.20027 1.90573 4.18045 1.87202 4.1676L0.330769 3.57487C0.233519 3.53742 0.149896 3.47138 0.0909158 3.38547C0.0319358 3.29955 0.000366211 3.19779 0.000366211 3.09358C0.000366211 2.98937 0.0319358 2.8876 0.0909158 2.80168C0.149896 2.71577 0.233519 2.64974 0.330769 2.61229L1.87202 2.01955C1.90569 2.00665 1.93627 1.9868 1.96177 1.9613C1.98727 1.9358 2.00712 1.90522 2.02003 1.87155L2.60749 0.344006C2.64062 0.254077 2.69763 0.174877 2.77239 0.114917C2.84716 0.0549574 2.93685 0.0165054 3.03182 0.00369366C3.14585 -0.0101684 3.26124 0.0144335 3.3597 0.0735981C3.45816 0.132763 3.53405 0.223104 3.57534 0.330295L4.16807 1.87155C4.18098 1.90522 4.20083 1.9358 4.22633 1.9613C4.25183 1.9868 4.28241 2.00665 4.31608 2.01955L5.85733 2.61229C5.95458 2.64974 6.0382 2.71577 6.09718 2.80168C6.15616 2.8876 6.18773 2.98937 6.18773 3.09358C6.18773 3.19779 6.15616 3.29955 6.09718 3.38547C6.0382 3.47138 5.95458 3.53742 5.85733 3.57487L4.31608 4.1676C4.28237 4.18045 4.25176 4.20027 4.22625 4.22578C4.20075 4.25129 4.18092 4.2819 4.16807 4.31561L3.57534 5.85686C3.5379 5.95412 3.47187 6.03776 3.38596 6.09675C3.30004 6.15574 3.19827 6.18732 3.09405 6.18733ZM14.0628 8.99983C13.9491 8.99979 13.8381 8.96531 13.7444 8.90091C13.6507 8.83652 13.5787 8.74525 13.5379 8.63912L12.7349 6.5519C12.7208 6.51512 12.6991 6.48172 12.6713 6.45386C12.6434 6.426 12.61 6.4043 12.5732 6.39018L10.486 5.58721C10.38 5.54635 10.2888 5.47433 10.2245 5.38064C10.1602 5.28694 10.1258 5.17597 10.1258 5.06233C10.1258 4.94869 10.1602 4.83771 10.2245 4.74402C10.2888 4.65032 10.38 4.5783 10.486 4.53744L12.5732 3.73448C12.61 3.72035 12.6434 3.69866 12.6713 3.6708C12.6991 3.64294 12.7208 3.60954 12.7349 3.57276L13.5319 1.5003C13.5683 1.40229 13.6306 1.31598 13.7121 1.25055C13.7936 1.18511 13.8914 1.143 13.9949 1.12869C14.1194 1.11363 14.2453 1.14056 14.3527 1.20521C14.46 1.26985 14.5428 1.36851 14.5877 1.48553L15.3907 3.57276C15.4048 3.60954 15.4265 3.64294 15.4543 3.6708C15.4822 3.69866 15.5156 3.72035 15.5524 3.73448L17.6396 4.53744C17.7456 4.5783 17.8368 4.65032 17.9011 4.74402C17.9654 4.83771 17.9998 4.94869 17.9998 5.06233C17.9998 5.17597 17.9654 5.28694 17.9011 5.38064C17.8368 5.47433 17.7456 5.54635 17.6396 5.58721L15.5524 6.39018C15.5156 6.4043 15.4822 6.426 15.4543 6.45386C15.4265 6.48172 15.4048 6.51512 15.3907 6.5519L14.5877 8.63912C14.5469 8.74525 14.4749 8.83652 14.3812 8.90091C14.2875 8.96531 14.1765 8.99979 14.0628 8.99983Z" 
          fill={isHovered ? "url(#sparkles-gradient)" : "#484DE6"}
          className="transition-all duration-300"
        />
      </g>
    </svg>
  );
};

export default function AIInputBox({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe your task shortly",
  maxWidth = "900px",
  className = "",
  disabled = false,
  fullWidth = false,
  borderRadius = 16,
  verticalPadding = 34,
  borderColors = {
    default: '#d1d5db',
    hover: '#6b7280',
    focus: '#2563eb'
  }
}: AIInputBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div 
      className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`}
      style={fullWidth ? { width: '100%', maxWidth } : { width: '60%', maxWidth }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main container with animated RGB border on hover/focus */}
      <div 
        className="bg-white relative size-full transition-all duration-300 border-[3px]"
        style={{
          borderRadius: `${borderRadius}px`,
          border: isFocused ? `3px solid ${borderColors.focus}` : isHovered ? `3px solid ${borderColors.hover}` : `3px solid ${borderColors.default}`
        }}
      >
        {/* Inner container - exact Figma structure with configurable padding top/bottom */}
        <div 
          className="box-border content-stretch flex gap-[20px] items-center max-h-inherit overflow-clip px-[24px] relative size-full cursor-text"
          style={{ 
            borderRadius: `${borderRadius}px`,
            paddingTop: `${verticalPadding}px`,
            paddingBottom: `${verticalPadding}px`
          }}
          onClick={(event) => {
            if (disabled) return;
            const target = event.target as HTMLElement;
            if (target.closest('button')) return;
            inputRef.current?.focus();
          }}
        >
          {/* Input container - matches Figma nested structure */}
          <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
            <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
              <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
                {/* Sparkles icon with smooth transition */}
                <div className="relative shrink-0" style={{ width: isHovered ? '18px' : '14px', height: isHovered ? '18px' : '14px' }}>
                  <SparklesIcon isHovered={isHovered} />
                </div>
                {/* Input text */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isFocused ? '' : placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={disabled}
                  className={`font-['Helvetica_Neue:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[16px] text-nowrap tracking-[0.32px] whitespace-pre outline-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0 transition-colors duration-300 ${
                    isHovered || isFocused ? 'text-[#0d0d0d] placeholder:text-gray-500' : 'text-[#222222] placeholder:text-gray-500'
                  }`}
                />
              </div>
            </div>
          </div>
          {/* Send button - exact Figma structure */}
          <div className="flex h-[16px] items-center justify-center relative shrink-0 w-[16px]">
            <button
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
              className="flex-none rotate-[-45deg] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 hover:-translate-y-0.5 focus:-translate-y-0.5"
            >
              <div className="relative size-[16px]">
                <Send 
                  className="block max-w-none size-full" 
                  fill="currentColor" 
                  style={{ color: disabled ? '#C8C8C8' : '#222222' }} 
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
