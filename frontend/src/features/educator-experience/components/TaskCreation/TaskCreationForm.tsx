'use client';

import { FormInput, RubricInput } from '../../../../shared/components/forms';
import type { TaskFormData } from '../../types';

// TODO(db): Initialize `data` from backend TaskFormData.
// - Load via GET /tasks/:id/form when a task is selected
// - Persist changes via PUT /tasks/:id/form or draft endpoint in onChange/onSave

export interface TaskCreationFormProps {
  data: TaskFormData;
  onChange: (data: TaskFormData) => void;
}

export default function TaskCreationForm({ data, onChange }: TaskCreationFormProps) {
  return (
    <div className="relative flex flex-col gap-10 items-start p-6 w-full max-h-screen overflow-y-auto pt-8 pb-[400px]">
      {/* Task Title */}
      <FormInput
        title="Task Title"
        type="textarea"
        value={data.title}
        onChange={(value) => onChange({ ...data, title: value as string })}
        placeholder="Eg: Understanding and Applying React Props in Component-Based Development"
        rows={4}
        className="h-[200px]"
      />

      {/* Objective */}
      <FormInput
        title="Objective"
        type="textarea"
        value={data.objective}
        onChange={(value) => onChange({ ...data, objective: value as string })}
        placeholder="Eg: By the end of this task, you will be able to analyze the role of props in React, design reusable components using props, and evaluate component behavior based on prop-driven information flow."
        rows={4}
        className="h-[200px]"
      />

      {/* Step by Step Instructions */}
      <FormInput
        title="Step by step instructions"
        type="array"
        value={data.steps}
        onChange={(value) => onChange({ ...data, steps: value as string[] })}
        addButtonText="Add Step"
        itemPlaceholder="Step instruction"
      />

      {/* Expected Output */}
      <FormInput
        title="Expected output"
        type="array"
        value={data.expectedOutputs}
        onChange={(value) => onChange({ ...data, expectedOutputs: value as string[] })}
        addButtonText="Add Output"
        itemPlaceholder="Expected output"
      />

      {/* Duration */}
      <FormInput
        title="Duration"
        type="text"
        value={data.duration}
        onChange={(value) => onChange({ ...data, duration: value as string })}
        placeholder="Estimated time: 6–8 hours"
      />

      {/* Resources */}
      <FormInput
        title="Resources"
        type="array"
        value={data.resources}
        onChange={(value) => onChange({ ...data, resources: value as string[] })}
        addButtonText="Add Resource"
        itemPlaceholder="Resource (link)"
      />

      {/* Reflection */}
      <FormInput
        title="Reflection"
        type="array"
        value={data.reflectionQuestions}
        onChange={(value) => onChange({ ...data, reflectionQuestions: value as string[] })}
        addButtonText="Add Question"
        itemPlaceholder="Reflection question"
      />

      {/* Assessment */}
      <div className="flex flex-col gap-8 items-start w-full">
        {/* Assessment Criteria */}
        <FormInput
          title="Assessment"
          type="array"
          value={data.assessmentCriteria}
          onChange={(value) => onChange({ ...data, assessmentCriteria: value as string[] })}
          addButtonText="Add Criterion"
          itemPlaceholder="Assessment criterion"
        />

        {/* Grading Rubric */}
        <div className="flex flex-col gap-3 items-start w-full">
          <div className="flex gap-2 items-center w-full">
            <p className="font-['Helvetica_Neue:Medium',sans-serif] text-[#414651] text-[20px] tracking-[0.4px]">
              Grading Rubric:
            </p>
          </div>
          
          <RubricInput
            value={data.rubric || []}
            onChange={(value) => onChange({ ...data, rubric: value })}
          />
        </div>
      </div>

      {/* Level of Task */}
      <FormInput
        title="Level of Task"
        type="text"
        value={data.levelOfTask}
        onChange={(value) => onChange({ ...data, levelOfTask: value as string })}
        placeholder="Introductory to Intermediate – Suitable for students with basic React knowledge"
      />

      {/* Support and Hints */}
      <FormInput
        title="Support and Hints"
        type="array"
        value={data.supportHints}
        onChange={(value) => onChange({ ...data, supportHints: value as string[] })}
        addButtonText="Add Hint"
        itemPlaceholder="Support hint"
      />

      {/* Academic Integrity */}
      <FormInput
        title="A Note on Academic Integrity"
        type="textarea"
        value={data.academicIntegrity}
        onChange={(value) => onChange({ ...data, academicIntegrity: value as string })}
        placeholder="Make sure your work is your own. If you use external sources or code snippets, cite them properly. Learning happens best when you build and reflect on your own solutions."
        rows={3}
      />

    </div>
  );
}
