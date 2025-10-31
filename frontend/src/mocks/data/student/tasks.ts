import type { StudentTask } from '../../../features/student-experience/types/studentTask';

export const mockStudentTasks: StudentTask[] = [
  {
    id: 'task-1',
    title: 'Understanding and Applying React Props in Component-Based Development',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Due in 5 days (GREEN)
    educatorName: 'Dr. Sarah Johnson',
    objective:
      'By the end of this task, you will be able to analyze the role of props in React, design reusable components using props, and evaluate component behavior based on prop-driven information flow.',
    instructions: [
      'Read the provided resources on React props and component architecture.',
      'Set up a basic React project using Create React App or Vite.',
      'Create a parent component (e.g., App) that renders at least three child components with different prop values.',
      'Design at least two reusable child components that accept props such as name, price, image, or status.',
      'Implement prop validation using PropTypes or TypeScript interfaces.',
      'Demonstrate dynamic rendering based on props.',
      'Document your code with comments explaining prop usage.',
      'Submit your project folder along with a short reflection explaining your design choices.',
    ],
    submissionChecklist: [
      'A working React project with reusable components.',
      'A short reflective report (PDF or Markdown).',
      'Documentation outlining prop usage.',
    ],
    hints: [
      'Start from the component hierarchy and identify prop flows.',
      'Validate props early to catch type mismatches.',
      'Showcase how props trigger conditional rendering or styling.',
    ],
    submission: {
      files: [],
      links: [],
      notes: '',
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: 'task-2',
    title: 'Mastering Java Inheritance and Polymorphism',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow (ORANGE)
    educatorName: 'Prof. Alan Thompson',
    objective:
      'Demonstrate the use of inheritance and polymorphism in a Java application that models a real-world scenario.',
    instructions: [
      'Design a class hierarchy with at least three levels of inheritance.',
      'Implement polymorphic behavior using interfaces or abstract classes.',
      'Include unit tests showing polymorphic method invocation.',
      'Document the hierarchy and polymorphic interactions.',
    ],
    submissionChecklist: [
      'Source code repository link.',
      'PDF briefing the class diagram and polymorphic flows.',
      'Test results demonstrating polymorphism.',
    ],
    submission: {
      files: [],
      links: [],
      notes: '',
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: 'task-3',
    title: 'Implementing Database Normalization Techniques',
    status: 'graded',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Overdue/Closed (GREY)
    educatorName: 'Dr. Emily Carter',
    objective:
      'Normalize a sample database schema to 3NF, explaining each transformation and the benefits achieved.',
    instructions: [
      'Analyze the provided unnormalized schema.',
      'Identify functional dependencies.',
      'Normalize step-by-step to 3NF, documenting each change.',
      'Implement the final schema using SQL and insert sample data.',
    ],
    submissionChecklist: [
      'Normalization report (PDF).',
      'SQL scripts for final schema.',
      'Sample dataset and queries demonstrating improvements.',
    ],
    submission: {
      files: [
        { id: 'file-3', name: 'NormalizationReport.pdf' },
        { id: 'file-4', name: 'FinalSchema.sql' },
      ],
      links: [],
      notes: 'Excited to hear feedback on optimization choices.',
      updatedAt: '2025-10-05T08:00:00.000Z',
    },
    summary: {
      clarityScore: 4,
      feedback: {
        educatorFeedback:
          'Solid normalization process. Consider exploring indexing strategies for large datasets.',
        aiAssessment: [
          'Schema Quality: Excellent normalization steps.',
          'Documentation: Clear and concise explanations.',
        ],
        status: 'passed',
      },
    },
  },
];
