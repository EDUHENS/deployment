'use client';

interface StatusBadgeProps {
  status: 'pass' | 'fail';
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const isPass = status === 'pass';
  
  return (
    <div className={`bg-[${isPass ? '#ecfdf3' : '#fdf2f2'}] box-border content-stretch flex gap-[10px] items-center justify-center px-[12px] py-[3px] relative rounded-[48px] shrink-0 ${className}`}>
      <p className={`font-['Helvetica_Neue:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[${isPass ? '#027a48' : '#e13838'}] text-[14px] text-nowrap tracking-[0.24px] whitespace-pre`}>
        {status === 'pass' ? 'Pass' : 'Fail'}
      </p>
    </div>
  );
}