'use client';

import { Edit3, Plus, CircleX } from 'lucide-react';

export type InputType = 'text' | 'textarea' | 'array' | 'rubric';

export interface FormInputProps {
  title: string;
  type: InputType;
  value: string | string[] | string[][];
  onChange: (value: string | string[] | string[][]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  multiline?: boolean;
  addButtonText?: string;
  itemPlaceholder?: string;
}

export default function FormInput({
  title,
  type,
  value,
  onChange,
  placeholder = '',
  rows = 3,
  className = '',
  multiline = false,
  addButtonText = 'Add Item',
  itemPlaceholder = 'Enter item...'
}: FormInputProps) {
  const handleTextChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleArrayChange = (index: number, newValue: string) => {
    if (Array.isArray(value)) {
      const newArray = [...value];
      newArray[index] = newValue;
      onChange(newArray);
    }
  };

  const addArrayItem = () => {
    if (Array.isArray(value)) {
      onChange([...value, '']);
    } else {
      onChange(['']);
    }
  };

  const removeArrayItem = (index: number) => {
    if (Array.isArray(value)) {
      const newArray = value.filter((_, i) => i !== index);
      onChange(newArray);
    }
  };

  const renderInput = () => {
    switch (type) {
      case 'text':
      case 'textarea':
        return (
          <div className={`bg-white border border-[#e6e6e6] border-solid rounded-[4px] w-full hover:border-[#484de6] focus-within:border-[#484de6] transition-colors ${className}`}>
            <div className="flex gap-8 items-start overflow-clip p-4 relative rounded-[inherit] w-full min-h-[60px]">
              {multiline || type === 'textarea' ? (
                <textarea
                  value={value as string}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={placeholder}
                  rows={rows}
                  className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow leading-normal min-h-[40px] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] outline-none resize-none focus:text-[#414651] transition-colors"
                />
              ) : (
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={placeholder}
                  className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow leading-normal min-h-[40px] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] outline-none focus:text-[#414651] transition-colors"
                />
              )}
              <div className="relative shrink-0 size-[20px] flex items-center">
                <Edit3 className="w-4 h-4 text-gray-400 group-hover:text-[#484de6] transition-colors" />
              </div>
            </div>
          </div>
        );

      case 'array':
        const arrayValue = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-col gap-2 items-start w-full">
            {arrayValue.map((item, index) => (
              <div key={index} className="flex gap-1 items-start w-full">
                <p className="font-['Helvetica_Neue:Medium',sans-serif] leading-normal not-italic relative shrink-0 text-[#999999] text-[14px] text-nowrap tracking-[0.28px] whitespace-pre">
                  {index + 1}.
                </p>
                <div className="basis-0 bg-white border border-[#e6e6e6] border-solid grow min-h-px min-w-px relative rounded-[4px] shrink-0 hover:border-[#484de6] focus-within:border-[#484de6] transition-colors">
                  <div className="flex gap-8 items-center overflow-clip p-4 relative rounded-[inherit] w-full min-h-[60px]">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange(index, e.target.value)}
                      placeholder={`${itemPlaceholder} ${index + 1}...`}
                      className="basis-0 font-['Helvetica_Neue:Regular',sans-serif] grow leading-normal min-h-[40px] min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] outline-none focus:text-[#414651] transition-colors"
                    />
                    <div className="relative shrink-0 size-[20px] flex items-center">
                      <button
                        onClick={() => removeArrayItem(index)}
                        className="text-gray-400 hover:text-red-500 hover:animate-rotate-360 transition-colors cursor-pointer"
                      >
                        <CircleX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Item Button */}
            <div className="flex gap-1 items-start pl-4 w-full">
              <button
                onClick={addArrayItem}
                type="button"
                className="flex items-center gap-2 text-[#717680] bg-white border border-[#e6e6e6] border-solid rounded-md px-4 py-2 cursor-pointer hover:border-[#999999] hover:bg-[#f8f8f8] hover:text-[#414651] active:bg-[#e8e8e8] active:border-[#999999] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-[#484de6]/10"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">{addButtonText}</span>
              </button>
            </div>
          </div>
        );

      case 'rubric':
        const rubricData = Array.isArray(value) && Array.isArray(value[0]) ? value as string[][] : [];
        const handleRubricChange = (row: number, col: number, newValue: string) => {
          const newRubric = [...rubricData];
          if (!newRubric[row]) newRubric[row] = [];
          newRubric[row][col] = newValue;
          onChange(newRubric);
        };

        return (
          <div className="flex flex-col items-center p-0 gap-3 w-[550px] h-[617px]">
            <div className="bg-[#e6e6e6] border border-[#e6e6e6] border-solid h-[575px] relative rounded-[4px] w-full">
              <div className="grid grid-cols-5 grid-rows-5 gap-[2px] h-[575px] overflow-clip relative rounded-[inherit] w-full">
                {/* Header Row */}
                <div className="bg-[#f2f2f2] flex gap-[10px] items-start overflow-clip pb-0 pt-8 px-4 relative shrink-0" style={{ gridArea: '1 / 1' }}>
                  <input
                    type="text"
                    value={rubricData[0]?.[0] || 'Criteria'}
                    onChange={(e) => handleRubricChange(0, 0, e.target.value)}
                    className="font-['Helvetica_Neue:Medium',sans-serif] grow leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none"
                  />
                </div>
                <div className="bg-[#f2f2f2] flex gap-[10px] items-start overflow-clip pb-0 pt-8 px-4 relative shrink-0" style={{ gridArea: '1 / 2' }}>
                  <input
                    type="text"
                    value={rubricData[0]?.[1] || 'Excellent'}
                    onChange={(e) => handleRubricChange(0, 1, e.target.value)}
                    className="font-['Helvetica_Neue:Medium',sans-serif] grow leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none"
                  />
                </div>
                <div className="bg-[#f2f2f2] flex gap-[10px] items-start overflow-clip pb-0 pt-8 px-4 relative shrink-0" style={{ gridArea: '1 / 3' }}>
                  <input
                    type="text"
                    value={rubricData[0]?.[2] || 'Good (75–89%)'}
                    onChange={(e) => handleRubricChange(0, 2, e.target.value)}
                    className="font-['Helvetica_Neue:Medium',sans-serif] grow leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none"
                  />
                </div>
                <div className="bg-[#f2f2f2] flex gap-[10px] items-start overflow-clip pb-0 pt-8 px-4 relative shrink-0" style={{ gridArea: '1 / 4' }}>
                  <input
                    type="text"
                    value={rubricData[0]?.[3] || 'Satisfactory (60–74%)'}
                    onChange={(e) => handleRubricChange(0, 3, e.target.value)}
                    className="font-['Helvetica_Neue:Medium',sans-serif] grow leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none"
                  />
                </div>
                <div className="bg-[#f2f2f2] flex gap-[10px] items-start overflow-clip pb-0 pt-8 px-4 relative shrink-0" style={{ gridArea: '1 / 5' }}>
                  <input
                    type="text"
                    value={rubricData[0]?.[4] || 'Needs Improvement (< 60%)'}
                    onChange={(e) => handleRubricChange(0, 4, e.target.value)}
                    className="font-['Helvetica_Neue:Medium',sans-serif] grow leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#535862] text-[14px] tracking-[0.28px] bg-transparent border-none outline-none"
                  />
                </div>
                
                {/* Editable Content Rows */}
                {[1, 2, 3, 4].map((row) => (
                  <>
                    <div className="bg-white flex gap-[10px] items-start overflow-clip p-[10px] relative shrink-0" style={{ gridArea: `${row + 1} / 1` }}>
                      <input
                        type="text"
                        value={rubricData[row]?.[0] || ''}
                        onChange={(e) => handleRubricChange(row, 0, e.target.value)}
                        placeholder="Enter criteria..."
                        className="font-['Helvetica_Neue:Regular',sans-serif] grow h-[27px] leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none"
                      />
                    </div>
                    <div className="bg-white flex gap-[10px] items-start overflow-clip p-[10px] relative shrink-0" style={{ gridArea: `${row + 1} / 2` }}>
                      <input
                        type="text"
                        value={rubricData[row]?.[1] || ''}
                        onChange={(e) => handleRubricChange(row, 1, e.target.value)}
                        placeholder="Excellent description..."
                        className="font-['Helvetica_Neue:Regular',sans-serif] grow h-[27px] leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none"
                      />
                    </div>
                    <div className="bg-white flex gap-[10px] items-start overflow-clip p-[10px] relative shrink-0" style={{ gridArea: `${row + 1} / 3` }}>
                      <input
                        type="text"
                        value={rubricData[row]?.[2] || ''}
                        onChange={(e) => handleRubricChange(row, 2, e.target.value)}
                        placeholder="Good description..."
                        className="font-['Helvetica_Neue:Regular',sans-serif] grow h-[27px] leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none"
                      />
                    </div>
                    <div className="bg-white flex gap-[10px] items-start overflow-clip p-[10px] relative shrink-0" style={{ gridArea: `${row + 1} / 4` }}>
                      <input
                        type="text"
                        value={rubricData[row]?.[3] || ''}
                        onChange={(e) => handleRubricChange(row, 3, e.target.value)}
                        placeholder="Satisfactory description..."
                        className="font-['Helvetica_Neue:Regular',sans-serif] grow h-[27px] leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none"
                      />
                    </div>
                    <div className="bg-white flex gap-[10px] items-start overflow-clip p-[10px] relative shrink-0" style={{ gridArea: `${row + 1} / 5` }}>
                      <input
                        type="text"
                        value={rubricData[row]?.[4] || ''}
                        onChange={(e) => handleRubricChange(row, 4, e.target.value)}
                        placeholder="Needs improvement description..."
                        className="font-['Helvetica_Neue:Regular',sans-serif] grow h-[27px] leading-normal min-h-px min-w-px not-italic relative shrink-0 text-[#717680] text-[16px] tracking-[0.32px] bg-transparent border-none outline-none"
                      />
                    </div>
                  </>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col gap-4 items-start w-full ${className}`}>
      {/* Header */}
      <div className="flex gap-2 items-center justify-center pl-2 w-full">
        <p className="font-['Helvetica_Neue:Medium',sans-serif] grow leading-normal not-italic text-[#414651] text-[20px] tracking-[0.4px]">
          {title}
        </p>
      </div>
      
      {/* Input Content */}
      {renderInput()}
    </div>
  );
}
