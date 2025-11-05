import type { Task, TaskFormData } from '../../features/educator-experience/types';

export const defaultTaskFormData: TaskFormData = {
  title: 'Building RESTful APIs with Node.js and Express: A Comprehensive Backend Development Project',
  objective: 'By the end of this task, you will be able to design, implement, and deploy a complete RESTful API using Node.js and Express.js.',
  steps: ['Set up your development environment', 'Initialize a new Node.js project'],
  expectedOutputs: ['A fully functional RESTful API', 'Complete source code repository'],
  duration: '2-3 weeks (15-20 hours total)',
  resources: ['Node.js Official Documentation', 'Express.js Guide'],
  reflectionQuestions: ['What was the most challenging aspect?'],
  assessmentCriteria: ['API Functionality', 'Code Quality'],
  rubric: [],
  levelOfTask: 'Intermediate',
  supportHints: ['Start with simple endpoints'],
  academicIntegrity: 'This project must be your original work.',
  gradingSystem: 'passfail'
};

export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Understanding and Applying React Props in Component-Based Development',
    dueDate: 1,
    submissions: 32,
    timeLeft: '1day 12hours',
    clarityScore: 5
  },
  {
    id: 2,
    title: 'Mastering Asynchronous JavaScript with Async/Await',
    dueDate: 3,
    submissions: 28,
    timeLeft: '3days 5hours',
    clarityScore: 4
  },
  {
    id: 3,
    title: 'Deep Dive into State Management with Redux',
    dueDate: 5,
    submissions: 15,
    timeLeft: '5days 2hours',
    clarityScore: 3
  },
  {
    id: 4,
    title: 'Exploring the Benefits of TypeScript with React',
    dueDate: 7,
    submissions: 42,
    timeLeft: '7days 8hours',
    clarityScore: 5
  },
  {
    id: 5,
    title: 'Implementing Custom Hooks for Better Code Reusability',
    dueDate: 0,
    submissions: 18,
    timeLeft: '12hours',
    clarityScore: 4
  },
  {
    id: 6,
    title: 'Performance Optimization Techniques for React Apps',
    dueDate: -2,
    submissions: 25,
    timeLeft: 'Overdue',
    clarityScore: 2
  },
  {
    id: 7,
    title: 'Building Responsive Layouts with React and CSS Grid',
    dueDate: -1,
    submissions: 30,
    timeLeft: 'Overdue',
    clarityScore: 3
  }
];
