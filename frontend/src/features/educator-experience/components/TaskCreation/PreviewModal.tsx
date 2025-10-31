'use client';

import { CircleX, Rocket } from 'lucide-react';
import type { TaskFormData } from '../../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskData: TaskFormData;
  onPublish?: () => void;
}

export default function PreviewModal({ isOpen, onClose, taskData, onPublish }: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-[#f8f8f8] border-4 border-[#cccccc] border-solid relative rounded-[32px] w-full h-[90vh] max-w-6xl flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 hover:animate-rotate-360 transition-colors duration-200 cursor-pointer"
        >
          <CircleX className="w-6 h-6" />
        </button>

        {/* Student Preview Badge */}
        <div className="absolute bg-[#f8f8f8] border-2 border-[#cccccc] border-solid flex items-center justify-center left-1/2 top-4 px-4 py-2 rounded-[24px] -translate-x-1/2">
          <p className="font-['Helvetica_Neue:Bold',sans-serif] text-[#484de6] text-[14px] text-center tracking-[0.28px]">
            How Students Will See This Task
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-16 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Task Title */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-[24px]">🚀</p>
                <h1 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  {taskData.title || 'Task Title'}
                </h1>
              </div>
            </div>

            {/* Objective */}
            {taskData.objective && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  🎯 Objective
                </h2>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5]">
                  {taskData.objective}
                </p>
              </div>
            )}

            {/* Step by step instructions */}
            {taskData.steps && taskData.steps.length > 0 && taskData.steps.some(step => step.trim()) && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  📋 Step by step instructions
                </h2>
                <div className="space-y-2">
                  {taskData.steps.map((step, index) => (
                    step.trim() && (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5] ml-5">
                          {step}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Expected output */}
            {taskData.expectedOutputs && taskData.expectedOutputs.length > 0 && taskData.expectedOutputs.some(output => output.trim()) && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  📦 What You&rsquo;ll Submit
                </h2>
                <div className="space-y-2">
                  {taskData.expectedOutputs.map((output, index) => (
                    output.trim() && (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5] ml-5">
                          {output}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Duration */}
            {taskData.duration && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  ⏳ How Long It&rsquo;ll Take
                </h2>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5]">
                  {taskData.duration}
                </p>
              </div>
            )}

            {/* Resources */}
            {taskData.resources && taskData.resources.length > 0 && taskData.resources.some(resource => resource.trim()) && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  📚 Resources to Help You
                </h2>
                <div className="space-y-2">
                  {taskData.resources.map((resource, index) => (
                    resource.trim() && (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#484de6] text-[14px] tracking-[0.28px] leading-[1.5] underline">
                          {resource}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Reflection */}
            {taskData.reflectionQuestions && taskData.reflectionQuestions.length > 0 && taskData.reflectionQuestions.some(question => question.trim()) && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  🪞 Reflect on Your Work
                </h2>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5]">
                  After completing the task, take a moment to think about the following:
                </p>
                <div className="space-y-2">
                  {taskData.reflectionQuestions.map((question, index) => (
                    question.trim() && (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5] ml-5">
                          {question}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Criteria */}
            {taskData.assessmentCriteria && taskData.assessmentCriteria.length > 0 && taskData.assessmentCriteria.some(criteria => criteria.trim()) && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  📊 How You&rsquo;ll Be Assessed
                </h2>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5]">
                  Your work will be evaluated based on these criteria:
                </p>
                <div className="space-y-2">
                  {taskData.assessmentCriteria.map((criteria, index) => (
                    criteria.trim() && (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5] ml-5">
                          {criteria}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Grading Rubric */}
            {taskData.rubric && taskData.rubric.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  📊 How You&rsquo;ll Be Assessed
                </h2>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5]">
                  Your work will be evaluated based on these criteria:
                </p>
                <div className="bg-[#e6e6e6] border border-[#e6e6e6] border-solid rounded-[4px] p-2">
                  <div className="grid grid-cols-[repeat(5,_minmax(0px,_1fr))] grid-rows-[repeat(5,_minmax(0px,_1fr))] gap-[2px] h-[575px]">
                    {/* Header Row */}
                    {taskData.rubric[0]?.map((header, colIndex) => (
                      <div key={colIndex} className="bg-[#2d2e34] flex items-center p-4 rounded-[2px]">
                        <p className="font-['Helvetica_Neue:Medium',sans-serif] text-[#f8f8f8] text-[12px] tracking-[0.24px] leading-[1.5]">
                          {header || `Column ${colIndex + 1}`}
                        </p>
                      </div>
                    ))}
                    
                    {/* Data Rows */}
                    {taskData.rubric.slice(1).map((row, rowIndex) => (
                      row.map((cell, colIndex) => (
                        <div key={`${rowIndex}-${colIndex}`} className="bg-white flex items-center p-2 rounded-[2px]">
                          <p className="font-['Helvetica_Neue:Medium',sans-serif] text-black text-[12px] tracking-[0.24px] leading-[1.5]">
                            {cell || '-'}
                          </p>
                        </div>
                      ))
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Level of Task */}
            {taskData.levelOfTask && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  🎓 Task Level
                </h2>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5]">
                  {taskData.levelOfTask}
                </p>
              </div>
            )}

            {/* Support and Hints */}
            {taskData.supportHints && taskData.supportHints.length > 0 && taskData.supportHints.some(hint => hint.trim()) && (
              <div className="flex flex-col gap-2">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  🧩 Tips and Support
                </h2>
                <div className="space-y-2">
                  {taskData.supportHints.map((hint, index) => (
                    hint.trim() && (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5] ml-5">
                          {hint}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Academic Integrity */}
            {taskData.academicIntegrity && (
              <div className="flex flex-col gap-2 pb-24">
                <h2 className="font-['Helvetica_Neue:Bold',sans-serif] text-[#222222] text-[16px] tracking-[0.32px]">
                  ⚖️ A Note on Academic Integrity
                </h2>
                <p className="font-['Helvetica_Neue:Regular',sans-serif] text-[#222222] text-[14px] tracking-[0.28px] leading-[1.5]">
                  {taskData.academicIntegrity}
                </p>
              </div>
            )}

            {/* Publish Button - Standard corporate padding */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-center">
              <button 
                onClick={onPublish}
                className="bg-[#484de6] border-[#6976eb] border-[3px] border-solid box-border content-stretch cursor-pointer flex gap-[7px] items-center justify-center px-[32px] py-[20px] relative rounded-[4px] hover:bg-[#3A3FE4] transition-colors duration-200">
                <div className="relative shrink-0 size-[16px]">
                  <Rocket className="w-4 h-4 text-[#f8f8f8]" />
                </div>
                <span className="font-['Helvetica_Neue:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#f8f8f8] text-[16px] text-nowrap whitespace-pre">
                  Publish Task
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
