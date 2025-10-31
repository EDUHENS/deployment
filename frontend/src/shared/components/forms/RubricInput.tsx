'use client';

interface RubricInputProps {
  value: string[][];
  onChange: (value: string[][]) => void;
}

export default function RubricInput({ value, onChange }: RubricInputProps) {
  const handleRubricChange = (row: number, col: number, newValue: string) => {
    const newRubric = [...value];
    if (!newRubric[row]) newRubric[row] = [];
    newRubric[row][col] = newValue;
    onChange(newRubric);
  };

  // Ensure we have at least one row and column
  const rubricData = value.length > 0 ? value : [['', '', '', '', '']];

  return (
    <div className="content-stretch flex flex-col gap-[12px] items-center relative size-full">
      <div className="content-stretch flex items-center relative shrink-0 w-full">
        <div className="basis-0 bg-[#e6e6e6] border border-[#e6e6e6] border-solid grow h-[575px] min-h-px min-w-px relative shrink-0">
          <div className="gap-[2px] grid grid-cols-[repeat(5,_minmax(0px,_1fr))] grid-rows-[repeat(5,_minmax(0px,_1fr))] h-[575px] overflow-clip relative rounded-[inherit] w-full">
            {/* Header Row */}
            <div className="[grid-area:1_/_1] bg-[#f2f2f2] box-border content-stretch flex gap-[10px] items-center overflow-clip pb-0 pt-[32px] px-[16px] relative shrink-0 hover:bg-[#e8e8e8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[0]?.[0] || 'Criteria'}
                onChange={(e) => handleRubricChange(0, 0, e.target.value)}
                className="basis-0 font-['Helvetica_Neue:Medium',sans-serif] grow leading-[1.5] min-h-[40px] min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:1_/_2] bg-[#f2f2f2] box-border content-stretch flex gap-[10px] items-center overflow-clip pb-0 pt-[32px] px-[16px] relative shrink-0 hover:bg-[#e8e8e8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[0]?.[1] || 'Excellent'}
                onChange={(e) => handleRubricChange(0, 1, e.target.value)}
                className="basis-0 font-['Helvetica_Neue:Medium',sans-serif] grow leading-[1.5] min-h-[40px] min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:1_/_3] bg-[#f2f2f2] box-border content-stretch flex gap-[10px] items-center overflow-clip pb-0 pt-[32px] px-[16px] relative shrink-0 hover:bg-[#e8e8e8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[0]?.[2] || 'Good (75–89%)'}
                onChange={(e) => handleRubricChange(0, 2, e.target.value)}
                className="basis-0 font-['Helvetica_Neue:Medium',sans-serif] grow leading-[1.5] min-h-[40px] min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:1_/_4] bg-[#f2f2f2] box-border content-stretch flex gap-[10px] items-center overflow-clip pb-0 pt-[32px] px-[16px] relative shrink-0 hover:bg-[#e8e8e8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[0]?.[3] || 'Satisfactory (60–74%)'}
                onChange={(e) => handleRubricChange(0, 3, e.target.value)}
                className="basis-0 font-['Helvetica_Neue:Medium',sans-serif] grow leading-[1.5] min-h-[40px] min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:1_/_5] bg-[#f2f2f2] box-border content-stretch flex gap-[10px] items-center overflow-clip pb-0 pt-[32px] px-[16px] relative shrink-0 hover:bg-[#e8e8e8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[0]?.[4] || 'Needs Improvement (<60%)'}
                onChange={(e) => handleRubricChange(0, 4, e.target.value)}
                className="basis-0 font-['Helvetica_Neue:Medium',sans-serif] grow leading-[1.5] min-h-[40px] min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>

            {/* Data Rows - Row 2 */}
            <div className="[grid-area:2_/_1] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[1]?.[0] || ''}
                onChange={(e) => handleRubricChange(1, 0, e.target.value)}
                placeholder="Component Design & Props"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:2_/_2] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[1]?.[1] || ''}
                onChange={(e) => handleRubricChange(1, 1, e.target.value)}
                placeholder="Clear, reusable, dynamic"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:2_/_3] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[1]?.[2] || ''}
                onChange={(e) => handleRubricChange(1, 2, e.target.value)}
                placeholder="Mostly reusable, some dynamic"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:2_/_4] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[1]?.[3] || ''}
                onChange={(e) => handleRubricChange(1, 3, e.target.value)}
                placeholder="Basic use of props"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:2_/_5] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[1]?.[4] || ''}
                onChange={(e) => handleRubricChange(1, 4, e.target.value)}
                placeholder="Incomplete or incorrect use"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>

            {/* Data Rows - Row 3 */}
            <div className="[grid-area:3_/_1] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[2]?.[0] || ''}
                onChange={(e) => handleRubricChange(2, 0, e.target.value)}
                placeholder="Code Quality & Validation"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:3_/_2] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[2]?.[1] || ''}
                onChange={(e) => handleRubricChange(2, 1, e.target.value)}
                placeholder="Clean, well-documented, validated"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:3_/_3] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[2]?.[2] || ''}
                onChange={(e) => handleRubricChange(2, 2, e.target.value)}
                placeholder="Minor issues"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:3_/_4] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[2]?.[3] || ''}
                onChange={(e) => handleRubricChange(2, 3, e.target.value)}
                placeholder="Some documentation"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:3_/_5] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[2]?.[4] || ''}
                onChange={(e) => handleRubricChange(2, 4, e.target.value)}
                placeholder="Poor structure"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>

            {/* Data Rows - Row 4 */}
            <div className="[grid-area:4_/_1] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[3]?.[0] || ''}
                onChange={(e) => handleRubricChange(3, 0, e.target.value)}
                placeholder="Report & Reflection"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:4_/_2] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[3]?.[1] || ''}
                onChange={(e) => handleRubricChange(3, 1, e.target.value)}
                placeholder="Insightful, well-structured"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:4_/_3] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[3]?.[2] || ''}
                onChange={(e) => handleRubricChange(3, 2, e.target.value)}
                placeholder="Adequate"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:4_/_4] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[3]?.[3] || ''}
                onChange={(e) => handleRubricChange(3, 3, e.target.value)}
                placeholder="Basic"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:4_/_5] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[3]?.[4] || ''}
                onChange={(e) => handleRubricChange(3, 4, e.target.value)}
                placeholder="Missing or unclear"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>

            {/* Data Rows - Row 5 */}
            <div className="[grid-area:5_/_1] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[4]?.[0] || ''}
                onChange={(e) => handleRubricChange(4, 0, e.target.value)}
                placeholder="Creativity & Originality"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:5_/_2] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[4]?.[1] || ''}
                onChange={(e) => handleRubricChange(4, 1, e.target.value)}
                placeholder="Unique, thoughtful design"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:5_/_3] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[4]?.[2] || ''}
                onChange={(e) => handleRubricChange(4, 2, e.target.value)}
                placeholder="Some creativity"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:5_/_4] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[4]?.[3] || ''}
                onChange={(e) => handleRubricChange(4, 3, e.target.value)}
                placeholder="Minimal effort"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
            <div className="[grid-area:5_/_5] bg-white box-border content-stretch flex gap-[10px] items-center overflow-clip p-[10px] relative shrink-0 hover:bg-[#f8f8f8] transition-colors min-h-[60px]">
              <input
                type="text"
                value={rubricData[4]?.[4] || ''}
                onChange={(e) => handleRubricChange(4, 4, e.target.value)}
                placeholder="Generic or copied"
                className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow min-h-[40px] leading-[1.5] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none focus:text-[#414651] transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
