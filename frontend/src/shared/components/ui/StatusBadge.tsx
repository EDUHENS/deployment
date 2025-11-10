'use client';

interface StatusBadgeProps {
  status: 'pass' | 'fail' | 'pending';
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (status === 'pending') {
    return (
      <div className={`bg-[#f2f2f2] box-border content-stretch flex gap-[10px] items-center justify-center px-[12px] py-[3px] relative rounded-[48px] shrink-0 ${className}`}>
        <p className={`font-['Helvetica_Neue:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#717680] text-[14px] text-nowrap tracking-[0.24px] whitespace-pre`}>
          Pending
        </p>
      </div>
    );
  }
  const isPass = status === 'pass';
  const bg = isPass ? '#ecfdf3' : '#fdf2f2';
  const fg = isPass ? '#027a48' : '#e13838';
  return (
    <div className={`box-border content-stretch flex gap-[10px] items-center justify-center px-[12px] py-[3px] relative rounded-[48px] shrink-0 ${className}`}
         style={{ backgroundColor: bg }}>
      <p className={`font-['Helvetica_Neue:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[14px] text-nowrap tracking-[0.24px] whitespace-pre`}
         style={{ color: fg }}>
        {isPass ? 'Pass' : 'Fail'}
      </p>
    </div>
  );
}
