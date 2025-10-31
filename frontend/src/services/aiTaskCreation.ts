import type { TaskFormData } from '../features/educator-experience/types';

export interface AITaskCreationRequest {
  ai_task_creation_guidelines: {
    purpose: string;
    rules: string[];
    task_structure: {
      title: string;
      objective: string;
      instructions: string;
      expected_output: string;
      duration: string;
      resources: string;
      reflection: string;
      assessment: {
        criteria: string[];
        grading_rubric: string;
      };
      level_of_task: string;
      support_and_hints: string;
    };
    default_behaviors: {
      if_teacher_input_is_missing: string;
      if_teacher_input_is_partial: string;
      if_teacher_input_is_conflicting: string;
    };
  };
  teacher_specification: string;
}

export interface AITaskCreationResponse {
  success: boolean;
  task?: {
    title: string;
    objective: string;
    instructions: string[];
    expected_output: string[];
    duration: string;
    resources: string[];
    reflection_questions: string[];
    assessment_criteria: string[];
    rubric: string[][];
    level_of_task: string;
    support_hints: string[];
    academic_integrity: string;
  };
  error?: string;
}

export function createAITaskRequest(teacherInput: string): AITaskCreationRequest {
  return {
    ai_task_creation_guidelines: {
      purpose: "Always generate rigorous, student-facing tasks suitable for bachelor, master, PhD, vocational, corporate training, or hobby learning. Teacher input is only a specification, not the final task. Expand into a full assignment with all necessary academic or practical elements.",
      rules: [
        "Never only rephrase teacher input; always expand into a comprehensive task.",
        "Tasks must include title, objective, detailed instructions, expected output, resources, reflection, assessment criteria, grading rubric, level of task, duration, and support.",
        "Default to higher education standards (Bloom's taxonomy) but adapt to vocational, hobby, or corporate training contexts.",
        "If teacher leaves fields blank, assume best-practice defaults.",
        "Respect academic and practical integrity: always remind learners to follow ethical practices (cite sources, show authentic work, etc.)."
      ],
      task_structure: {
        title: "Concise, informative, and topic-specific",
        objective: "Learning outcome in higher-order terms (analyze, evaluate, create, build, practice)",
        instructions: "Step-by-step numbered guidance for independent work",
        expected_output: "Unambiguous format of proof (essay, report, prototype, artwork, product, code, presentation, etc.)",
        duration: "Estimated completion time (hours/days/weeks)",
        resources: "Suggested readings, tools, or materials",
        reflection: "Critical reflection question(s)",
        assessment: {
          criteria: [
            "Relevance and completeness",
            "Depth of analysis or practice",
            "Clarity and rigor",
            "Originality and creativity"
          ],
          grading_rubric: "Percentage-based rubric or qualitative scale depending on context"
        },
        level_of_task: "Introductory / Intermediate / Advanced / Research",
        support_and_hints: "Scaffolding, examples, or hints to aid learning"
      },
      default_behaviors: {
        if_teacher_input_is_missing: "Auto-fill based on defaults and best practices",
        if_teacher_input_is_partial: "Respect input but enrich with missing elements",
        if_teacher_input_is_conflicting: "Ask up to 4 clarifying questions; otherwise assume defaults"
      }
    },
    teacher_specification: teacherInput
  };
}

export async function generateAITask(teacherInput: string): Promise<AITaskCreationResponse> {
  try {
    const request = createAITaskRequest(teacherInput);
    
    // TODO: Replace with actual API call to backend
    // const response = await fetch('/api/ai/generate-task', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(request),

    void request;
    // });
    
    // For now, simulate AI response with mock data
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    const mockResponse: AITaskCreationResponse = {
      success: true,
      task: {
        title: "Understanding and Applying React Props in Component-Based Development",
        objective: "By the end of this task, you will be able to analyze the role of props in React, design reusable components using props, and evaluate component behavior based on prop-driven information flow.",
        instructions: [
          "Read the provided resources on React props and component architecture.",
          "Set up a basic React project using Create React App or Vite.",
          "Create a parent component (e.g., App) that renders at least three child components with different prop values.",
          "Design at least two reusable child components (e.g., UserCard, ProductItem) that accept props such as name, price, image, or status.",
          "Implement prop validation using PropTypes or TypeScript interfaces.",
          "Demonstrate dynamic rendering based on props (e.g., conditional styling or content).",
          "Document your code with comments explaining how props are passed and used.",
          "Test your components by changing prop values and observing the output.",
          "Submit your project folder along with a short report (max 500 words) explaining your design choices and what you learned about props."
        ],
        expected_output: [
          "A working React project with at least two reusable components using props",
          "A short reflective report (PDF or Markdown)",
          "Clear documentation and prop validation in code"
        ],
        duration: "Estimated time: 6–8 hours",
        resources: [
          "React Official Docs – Props (link)",
          "PropTypes Documentation (link)",
          "Vite Setup Guide or Create React App (link)"
        ],
        reflection_questions: [
          "What challenges did you face when designing reusable components with props?",
          "How do props contribute to component modularity and scalability in React?"
        ],
        assessment_criteria: [
          "Relevance and completeness of components and prop usage",
          "Depth of analysis in the report",
          "Clarity and rigor in code structure and documentation",
          "Originality and creativity in component design"
        ],
        rubric: [
          ["Criteria", "Excellent", "Good (75–89%)", "Satisfactory (60–74%)", "Needs Improvement (< 60%)"],
          ["Component Design & Props", "Clear, reusable, dynamic", "Mostly reusable, some dynamic", "Basic use of props", "Incomplete or incorrect use"],
          ["Code Quality & Validation", "Clean, well-documented, validated", "Minor issues", "Some documentation", "Poor structure"],
          ["Report & Reflection", "Insightful, well-structured", "Adequate", "Basic", "Missing or unclear"],
          ["Creativity & Originality", "Unique, thoughtful design", "Some creativity", "Minimal effort", "Generic or copied"]
        ],
        level_of_task: "Introductory to Intermediate – Suitable for students with basic React knowledge",
        support_hints: [
          "Use props.name or destructuring (const {name} = props) to access props in child components",
          "Try conditional rendering: props.status === 'active'",
          "Use PropTypes to catch errors early",
          "Refer to examples in the React docs for inspiration"
        ],
        academic_integrity: "Make sure your work is your own. If you use external sources or code snippets, cite them properly. Learning happens best when you build and reflect on your own solutions."
      }
    };
    
    return mockResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

export function convertAITaskToFormData(aiTask: AITaskCreationResponse['task']): TaskFormData {
  if (!aiTask) {
    return {
      title: '',
      objective: '',
      steps: [''],
      expectedOutputs: [''],
      duration: '',
      resources: [''],
      reflectionQuestions: [''],
      assessmentCriteria: [''],
      rubric: [],
      levelOfTask: '',
      supportHints: [''],
      academicIntegrity: ''
    };
  }

    return {
      title: aiTask.title,
      objective: aiTask.objective,
      steps: aiTask.instructions,
      expectedOutputs: aiTask.expected_output,
      duration: aiTask.duration,
      resources: aiTask.resources,
      reflectionQuestions: aiTask.reflection_questions,
      assessmentCriteria: aiTask.assessment_criteria,
      rubric: aiTask.rubric,
      levelOfTask: aiTask.level_of_task,
      supportHints: aiTask.support_hints,
      academicIntegrity: aiTask.academic_integrity
    };
}
