'use client';

interface AIAssessmentBadgeProps {
  result: 'pass' | 'fail';
  className?: string;
}

export default function AIAssessmentBadge({ result, className = '' }: AIAssessmentBadgeProps) {
  const config = result === 'pass' 
    ? {
        text: 'Pass',
        classes: 'bg-[#ecfdf3] text-[#027a48]'
      }
    : {
        text: 'Fail', 
        classes: 'bg-[#fdf2f2] text-[#e13838]'
      };

  return (
    <div className={`flex items-center justify-center px-3 py-1 rounded-[48px] text-[12px] font-['Helvetica_Neue:Bold',sans-serif] tracking-[0.24px] ${config.classes} ${className}`}>
      {config.text}
    </div>
  );
}
